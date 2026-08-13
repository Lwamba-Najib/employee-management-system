<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\SalaryController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogger;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Admin gate: returns a 403 response, or null if the user is an admin
$requireAdmin = function () {
    $user = request()->user();
    if (!$user || $user->role !== 'admin') {
        return response()->json(['message' => 'Forbidden: admin role required'], 403);
    }
    return null;
};

// Protected Routes (Requires Login)
Route::middleware('auth:sanctum')->group(function () use ($requireAdmin) {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Employees — all logged-in users
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Salaries — all logged-in users
    Route::get('/salaries', [SalaryController::class, 'index']);
    Route::post('/salaries', [SalaryController::class, 'store']);
    Route::get('/salaries/{id}', [SalaryController::class, 'show']);
    Route::put('/salaries/{id}', [SalaryController::class, 'update']);
    Route::delete('/salaries/{id}', [SalaryController::class, 'destroy']);

    // ADMIN-ONLY: User management
        Route::get('/users', function () use ($requireAdmin) {
        $deny = $requireAdmin();
        if ($deny) return $deny;

        $query = DB::table('users');

        if (request()->filled('role')) $query->where('role', request()->query('role'));
        if (request()->filled('status')) $query->where('status', request()->query('status'));
        if (request()->filled('search')) {
            $s = request()->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('username', 'like', "%$s%")
                  ->orWhere('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('phone', 'like', "%$s%");
            });
        }

        return response()->json($query->orderBy('id')->get());
    });

    Route::put('/users/{id}', function ($id) use ($requireAdmin) {
        $deny = $requireAdmin();
        if ($deny) return $deny;

        $user = DB::table('users')->where('id', $id)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

                $data = request()->only(['name', 'email', 'role', 'first_name', 'last_name', 'username', 'phone', 'status']);

        if (request()->filled('password')) {
            $data['password'] = Hash::make(request('password'));
        }

        $data['updated_at'] = now();
        $old = (array) $user;
        DB::table('users')->where('id', $id)->update($data);
        AuditLogger::log('Users', 'Updated', $id, $data['name'] ?? $user->name, $old, $data);

        return response()->json(DB::table('users')->where('id', $id)->first());
    });

    Route::delete('/users/{id}', function ($id) use ($requireAdmin) {
        $deny = $requireAdmin();
        if ($deny) return $deny;

        $user = DB::table('users')->where('id', $id)->first();
        DB::table('personal_access_tokens')->where('tokenable_id', $id)->delete();
        DB::table('users')->where('id', $id)->delete();
        AuditLogger::log('Users', 'Deleted', $id, $user->name ?? null);

        return response()->json(['message' => 'User deleted successfully']);
    });

    // ADMIN-ONLY: Audit logs
    Route::get('/audit-logs', function () use ($requireAdmin) {
        $deny = $requireAdmin();
        if ($deny) return $deny;

        $query = DB::table('audit_logs');

        if (request()->filled('search')) {
            $s = request()->query('search');
            $query->where(function ($q) use ($s) {
                $q->where('user_name', 'like', '%' . $s . '%')
                  ->orWhere('module', 'like', '%' . $s . '%')
                  ->orWhere('action', 'like', '%' . $s . '%')
                  ->orWhere('record_label', 'like', '%' . $s . '%');
            });
        }
        if (request()->filled('user')) $query->where('user_name', request()->query('user'));
        if (request()->filled('module')) $query->where('module', request()->query('module'));
        if (request()->filled('action')) $query->where('action', request()->query('action'));
        if (request()->filled('from')) $query->whereDate('created_at', '>=', request()->query('from'));
        if (request()->filled('to')) $query->whereDate('created_at', '<=', request()->query('to'));

        $total = $query->count();
        $perPage = max(1, (int) request()->query('per_page', 10));
        $page = max(1, (int) request()->query('page', 1));

        $logs = $query->orderByDesc('id')->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'logs' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'users' => DB::table('audit_logs')->distinct()->pluck('user_name')->filter()->values(),
            'modules' => DB::table('audit_logs')->distinct()->pluck('module')->filter()->values(),
            'actions' => DB::table('audit_logs')->distinct()->pluck('action')->filter()->values(),
        ]);
    });
});