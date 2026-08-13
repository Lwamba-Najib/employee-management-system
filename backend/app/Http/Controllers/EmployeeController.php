<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogger;

class EmployeeController extends Controller
{
    private $fields = ['employee_number','first_name','last_name','name','gender','date_of_birth','national_id','phone','email','address','department','position','employment_type','date_of_employment','salary','supervisor','bank_name','bank_account_number','tin','nssf_number','status','notes'];

    public function index(Request $request)
    {
        $query = DB::table('employees')->whereNull('deleted_at');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                foreach (['employee_number','name','first_name','last_name','email','phone','department','position'] as $col) {
                    $q->orWhere($col, 'like', '%' . $search . '%');
                }
            });
        }

        if ($request->filled('department')) $query->where('department', $request->query('department'));
        if ($request->filled('designation')) $query->where('position', $request->query('designation'));
        if ($request->filled('status')) $query->where('status', $request->query('status'));

        $total = $query->count();
        $perPage = max(1, (int) $request->query('per_page', 5));
        $page = max(1, (int) $request->query('page', 1));

        $employees = $query->orderBy('id')->skip(($page - 1) * $perPage)->take($perPage)->get();

        $alive = DB::table('employees')->whereNull('deleted_at');

        return response()->json([
            'employees' => $employees,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'stats' => [
                'total_employees' => (clone $alive)->count(),
                'active_employees' => (clone $alive)->where('status', 'Active')->count(),
                'inactive_employees' => (clone $alive)->where('status', '!=', 'Active')->count(),
                'total_users' => DB::table('users')->count(),
                'monthly_payroll' => (clone $alive)->where('status', 'Active')->sum('salary'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = array_filter($request->only($this->fields), function ($v) { return $v !== '' && $v !== null; });

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos', 'public');
        }

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $data['name'] = trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
        }

        $data['first_name'] = $data['first_name'] ?? '';
        $data['last_name'] = $data['last_name'] ?? '';
        $data['email'] = $data['email'] ?? '';
        $data['position'] = $data['position'] ?? 'Unassigned';
        $data['salary'] = $data['salary'] ?? 0;
        $data['status'] = $data['status'] ?? 'Active';

        $data['created_by'] = $request->user() ? $request->user()->id : null;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('employees')->insertGetId($data);
        AuditLogger::log('Employees', 'Created', $id, $data['name'], null, $data);

        return response()->json(DB::table('employees')->where('id', $id)->first(), 201);
    }

    public function show($id)
    {
        $employee = DB::table('employees')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$employee) return response()->json(['message' => 'Employee not found'], 404);
        return response()->json($employee);
    }

    public function update(Request $request, $id)
    {
        $exists = DB::table('employees')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$exists) return response()->json(['message' => 'Employee not found'], 404);

        $data = array_filter($request->only($this->fields), function ($v) { return $v !== '' && $v !== null; });

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('photos', 'public');
        }

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $first = $data['first_name'] ?? $exists->first_name;
            $last = $data['last_name'] ?? $exists->last_name;
            $data['name'] = trim(($first ?? '') . ' ' . ($last ?? ''));
        }

        $data['updated_by'] = $request->user() ? $request->user()->id : null;
        $data['updated_at'] = now();

        $old = (array) $exists;
        DB::table('employees')->where('id', $id)->update($data);
        AuditLogger::log('Employees', 'Updated', $id, $data['name'] ?? $exists->name, $old, $data);

        return response()->json(DB::table('employees')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $exists = DB::table('employees')->where('id', $id)->whereNull('deleted_at')->first();
        DB::table('employees')->where('id', $id)->update(['deleted_at' => now()]);
        AuditLogger::log('Employees', 'Deleted', $id, $exists->name ?? null);
        return response()->json(['message' => 'Employee deleted']);
    }
}