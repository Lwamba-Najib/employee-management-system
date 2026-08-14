<?php

namespace App\Http\Controllers;

use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    // Fields that can be mass-assigned from requests
    private const FILLABLE = [
        'employee_number', 'first_name', 'last_name', 'name', 'gender',
        'date_of_birth', 'national_id', 'phone', 'email', 'address',
        'department', 'position', 'employment_type', 'date_of_employment',
        'salary', 'supervisor', 'bank_name', 'bank_account_number',
        'tin', 'nssf_number', 'status', 'notes',
    ];

    private const MAX_PER_PAGE = 100;

    public function index(Request $request)
    {
        $query = DB::table('employees')->whereNull('deleted_at');

        // Search across multiple fields
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $searchable = ['employee_number', 'name', 'first_name', 'last_name', 'email', 'phone', 'department', 'position'];
                foreach ($searchable as $col) {
                    $q->orWhere($col, 'like', "%{$search}%");
                }
            });
        }

        // Apply filters
        if ($request->filled('department')) {
            $query->where('department', $request->query('department'));
        }
        if ($request->filled('designation')) {
            $query->where('position', $request->query('designation'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $total = $query->count();
        $perPage = min(max(1, (int) $request->query('per_page', 5)), self::MAX_PER_PAGE);
        $page = max(1, (int) $request->query('page', 1));

        $employees = $query->orderBy('id')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        // Compute dashboard stats
        $statsQuery = DB::table('employees')->whereNull('deleted_at');

        return response()->json([
            'employees' => $employees,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'stats' => [
                'total_employees' => (clone $statsQuery)->count(),
                'active_employees' => (clone $statsQuery)->where('status', 'Active')->count(),
                'inactive_employees' => (clone $statsQuery)->where('status', '!=', 'Active')->count(),
                'total_users' => DB::table('users')->count(),
                'monthly_payroll' => (clone $statsQuery)->where('status', 'Active')->sum('salary'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'nullable|email|max:255',
            'salary' => 'nullable|numeric|min:0',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
        ]);

        $data = $this->extractFields($request);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos', 'public');
        }

        // Reconstruct full name from first + last
        if (isset($data['first_name']) || isset($data['last_name'])) {
            $data['name'] = trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
        }

        // Apply defaults for required fields
        $data['first_name'] = $data['first_name'] ?? '';
        $data['last_name'] = $data['last_name'] ?? '';
        $data['email'] = $data['email'] ?? '';
        $data['position'] = $data['position'] ?? 'Unassigned';
        $data['salary'] = $data['salary'] ?? 0;
        $data['status'] = $data['status'] ?? 'Active';

        $data['created_by'] = $request->user()?->id;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('employees')->insertGetId($data);

        AuditLogger::log('Employees', 'Created', $id, $data['name'], null, $data);

        return response()->json(DB::table('employees')->where('id', $id)->first(), 201);
    }

    public function show($id)
    {
        $employee = DB::table('employees')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        return response()->json($employee);
    }

    public function update(Request $request, $id)
    {
        $existing = DB::table('employees')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        if (!$existing) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $validated = $request->validate([
            'email' => 'nullable|email|max:255',
            'salary' => 'nullable|numeric|min:0',
            'first_name' => 'nullable|string|max:100',
            'last_name' => 'nullable|string|max:100',
        ]);

        $data = $this->extractFields($request);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos', 'public');
        }

        // Reconstruct full name if first or last name changed
        if (isset($data['first_name']) || isset($data['last_name'])) {
            $first = $data['first_name'] ?? $existing->first_name;
            $last = $data['last_name'] ?? $existing->last_name;
            $data['name'] = trim("{$first} {$last}");
        }

        $data['updated_by'] = $request->user()?->id;
        $data['updated_at'] = now();

        $old = (array) $existing;
        DB::table('employees')->where('id', $id)->update($data);

        AuditLogger::log('Employees', 'Updated', $id, $data['name'] ?? $existing->name, $old, $data);

        return response()->json(DB::table('employees')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $employee = DB::table('employees')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        DB::table('employees')->where('id', $id)->update(['deleted_at' => now()]);

        AuditLogger::log('Employees', 'Deleted', $id, $employee->name);

        return response()->json(['message' => 'Employee deleted']);
    }

    /**
     * Extract only the fillable fields from the request, allowing empty strings
     * (so users can intentionally clear a field like "supervisor").
     */
    private function extractFields(Request $request): array
    {
        return array_filter(
            $request->only(self::FILLABLE),
            fn($v) => $v !== null && $v !== ''
        );
    }
}