<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Services\AuditLogger;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

                $existing = User::where('email', $validated['email'])->first();
        if ($existing && ($existing->status ?? 'Active') !== 'Active') {
            AuditLogger::log('Auth', 'Login Blocked (Inactive)', $existing->id, $existing->name, null, null, 'Failed');
            return response()->json(['message' => 'Your account is deactivated. Contact the administrator.'], 403);
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
            'status' => 'nullable|in:Active,Inactive',
        ]);

                $actor = auth('sanctum')->user();
        $role = ($actor && $actor->role === 'admin' && in_array($request->input('role'), ['admin', 'user'], true))
            ? $request->input('role')
            : 'user'; // 🔒 public registrations can never self-assign admin

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

        AuditLogger::log('Auth', 'Register', $user->id, $user->name, null, ['email' => $user->email, 'role' => 'user'], 'Success');

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
            $request->user()->currentAccessToken()->delete();
        }
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ], 200);
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

        if (!$user) {
            return response()->json(['message' => 'If that email exists, a reset code was generated.'], 200);
        }

        // Generate 6-digit code, store in password_reset_tokens table
        $token = (string) random_int(100000, 999999);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        AuditLogger::log('Auth', 'Forgot Password', $user->id, $user->name, null, null, 'Success');
                // NOTE: Railway blocks outbound SMTP — show code on screen for now.
        // Swap to an HTTP mail API (Postmark/Brevo) for real emails later.
        return response()->json([
            'message' => 'Reset code generated. Enter it below.',
            'reset_code' => $token,
        ]);

        return response()->json(['message' => 'Reset code sent to your email!']);    }

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

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        AuditLogger::log('Auth', 'Reset Password', $user->id, $user->name, null, null, 'Success');

        return response()->json(['message' => 'Password reset successfully. Please log in again.']);
    }
}