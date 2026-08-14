<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // Reset tokens expire after this many minutes
    private const RESET_TOKEN_TTL = 60;

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Block login attempts for inactive/suspended accounts
        $existing = User::where('email', $validated['email'])->first();
        if ($existing && ($existing->status ?? 'Active') !== 'Active') {
            AuditLogger::log('Auth', 'Login Blocked (Inactive)', $existing->id, $existing->name, null, null, 'Failed');
            return response()->json([
                'message' => 'Your account is deactivated. Contact the administrator.',
            ], 403);
        }

        if (!Auth::attempt($validated)) {
            AuditLogger::log('Auth', 'Login Failed', null, $validated['email'], null, null, 'Failed');
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogger::log('Auth', 'Login', $user->id, $user->name, null, null, 'Success');

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'username' => 'nullable|string|max:100|unique:users',
            'phone' => 'nullable|string|max:30',
            'role' => 'nullable|string|in:admin,user',
            'status' => 'nullable|in:Active,Inactive',
        ]);

        // Only admins can assign the admin role — public registrations are always 'user'
        $actor = auth('sanctum')->user();
        $role = ($actor && $actor->role === 'admin' && $request->input('role') === 'admin')
            ? 'admin'
            : 'user';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'first_name' => $validated['first_name'] ?? null,
            'last_name' => $validated['last_name'] ?? null,
            'username' => $validated['username'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'] ?? 'Active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogger::log('Auth', 'Register', $user->id, $user->name, null, [
            'email' => $user->email,
            'role' => $role,
        ], 'Success');

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            AuditLogger::log('Auth', 'Logout', $user->id, $user->name, null, null, 'Success');
            $user->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json(['user' => $request->user()], 200);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            AuditLogger::log('Auth', 'Change Password', $user->id, $user->name, null, null, 'Failed');
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        AuditLogger::log('Auth', 'Change Password', $user->id, $user->name, null, null, 'Success');

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Always return the same response to prevent email enumeration
        if (!$user) {
            return response()->json([
                'message' => 'If that email exists, a reset code was generated.',
            ], 200);
        }

        $token = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        AuditLogger::log('Auth', 'Forgot Password', $user->id, $user->name, null, null, 'Success');

        // Railway blocks outbound SMTP — code is returned directly to the frontend.
        // When switching to a real email provider, remove reset_code and send via Mail::raw().
        return response()->json([
            'message' => 'Reset code generated. Enter it below.',
            'reset_code' => $token,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')->where('email', $validated['email'])->first();

        if (!$record || !Hash::check($validated['token'], $record->token)) {
            return response()->json(['message' => 'Invalid or expired reset code'], 422);
        }

        // Reject expired tokens (older than RESET_TOKEN_TTL minutes)
        $tokenAge = now()->diffInMinutes($record->created_at);
        if ($tokenAge > self::RESET_TOKEN_TTL) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json(['message' => 'Reset code has expired. Please request a new one.'], 422);
        }

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Revoke all existing tokens so old sessions cannot be reused
        $user->tokens()->delete();

        AuditLogger::log('Auth', 'Reset Password', $user->id, $user->name, null, null, 'Success');

        return response()->json(['message' => 'Password reset successfully. Please log in again.']);
    }
}