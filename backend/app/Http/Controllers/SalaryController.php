<?php

namespace App\Http\Controllers;

use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    private const EARNINGS = [
        'basic_salary', 'housing_allowance', 'transport_allowance',
        'medical_allowance', 'other_allowances', 'bonus',
    ];

    private const DEDUCTIONS = [
        'paye', 'nssf_deduction', 'loan_deduction', 'other_deductions',
    ];

    private const FILLABLE = [
        'employee_id', 'payroll_month', 'payroll_year',
        'basic_salary', 'housing_allowance', 'transport_allowance',
        'medical_allowance', 'other_allowances', 'bonus',
        'paye', 'nssf_deduction', 'loan_deduction', 'other_deductions',
        'payment_date', 'payment_status',
    ];

    private const SORTABLE = [
        'id', 'employee_id', 'payroll_year', 'payroll_month',
        'gross_salary', 'net_salary', 'payment_status', 'payment_date', 'created_at',
    ];

    private const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    private const MAX_PER_PAGE = 100;

    public function index(Request $request)
    {
        $perPage = min(max(1, (int) $request->query('per_page', 10)), self::MAX_PER_PAGE);
        $page = max(1, (int) $request->query('page', 1));

        // Sort column goes into orderBy, so whitelist it
        $sort = $request->query('sort', 'id');
        if (!in_array($sort, self::SORTABLE, true)) {
            $sort = 'id';
        }
        $dir = strtolower($request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $total = $this->baseQuery($request)->count();

        $salaries = $this->baseQuery($request)
            ->select('salaries.*', 'employees.name as employee_name', 'employees.employee_number as employee_number')
            ->orderBy("salaries.{$sort}", $dir)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $statsRows = $this->baseQuery($request)
            ->select('salaries.payment_status', 'salaries.net_salary')
            ->get();

        return response()->json([
            'salaries' => $salaries,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'stats' => [
                'total_records' => count($statsRows),
                'pending' => $statsRows->where('payment_status', 'Pending')->count(),
                'paid' => $statsRows->where('payment_status', 'Paid')->count(),
                'total_net' => $statsRows->sum('net_salary'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate($this->rules(true));

        // One record per employee per period
        $duplicate = DB::table('salaries')
            ->where('employee_id', $request->input('employee_id'))
            ->where('payroll_month', $request->input('payroll_month'))
            ->where('payroll_year', (int) $request->input('payroll_year'))
            ->whereNull('deleted_at')
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A salary record for this employee and period already exists.',
            ], 422);
        }

        $data = $request->only(self::FILLABLE);
        $data += $this->computeTotals($data);
        $data['created_by'] = $request->user()?->id;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('salaries')->insertGetId($data);

        AuditLogger::log('Salaries', 'Created', $id, $this->auditLabel($id), null, $data, 'Success');

        return response()->json(DB::table('salaries')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $row = DB::table('salaries')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$row) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        $request->validate($this->rules(false));

        $old = (array) $row;
        $incoming = $request->only(self::FILLABLE);

        // Merge before computing so partial updates keep correct totals
        $incoming += $this->computeTotals(array_merge($old, $incoming));
        $incoming['updated_by'] = $request->user()?->id;
        $incoming['updated_at'] = now();

        DB::table('salaries')->where('id', $id)->update($incoming);

        AuditLogger::log('Salaries', 'Updated', $id, $this->auditLabel($id), $old, array_merge($old, $incoming), 'Success');

        return response()->json(DB::table('salaries')->where('id', $id)->first());
    }

    public function destroy(Request $request, $id)
    {
        $row = DB::table('salaries')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$row) {
            return response()->json(['message' => 'Salary record not found'], 404);
        }

        $old = (array) $row;

        DB::table('salaries')->where('id', $id)->update(['deleted_at' => now()]);

        AuditLogger::log('Salaries', 'Deleted', $id, $this->auditLabel($id), $old, null, 'Success');

        return response()->json(['message' => 'Salary record deleted']);
    }

    private function baseQuery(Request $request)
    {
        $query = DB::table('salaries')
            ->leftJoin('employees', 'salaries.employee_id', '=', 'employees.id')
            ->whereNull('salaries.deleted_at');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($w) use ($search) {
                $w->where('employees.name', 'like', "%{$search}%")
                  ->orWhere('employees.employee_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('month')) {
            $query->where('salaries.payroll_month', $request->query('month'));
        }
        if ($request->filled('year')) {
            $query->where('salaries.payroll_year', (int) $request->query('year'));
        }
        if ($request->filled('status')) {
            $query->where('salaries.payment_status', $request->query('status'));
        }

        return $query;
    }

    private function rules(bool $creating): array
    {
        $money = array_fill_keys(
            array_merge(self::EARNINGS, self::DEDUCTIONS),
            'nullable|numeric|min:0'
        );

        return $money + [
            'employee_id' => ($creating ? 'required' : 'sometimes') . '|integer|exists:employees,id',
            'payroll_month' => ($creating ? 'required' : 'sometimes') . '|string|in:' . implode(',', self::MONTHS),
            'payroll_year' => ($creating ? 'required' : 'sometimes') . '|integer|min:2000|max:2100',
            'payment_date' => 'nullable|date',
            'payment_status' => 'nullable|in:Pending,Paid',
        ];
    }

    private function computeTotals(array $row): array
    {
        $num = fn ($key) => (float) ($row[$key] ?? 0);

        $gross = collect(self::EARNINGS)->sum(fn ($field) => $num($field));
        $deductions = collect(self::DEDUCTIONS)->sum(fn ($field) => $num($field));

        return [
            'gross_salary' => $gross,
            'net_salary' => $gross - $deductions,
        ];
    }

    // e.g. "John Doe — August 2026"
    private function auditLabel($id): string
    {
        $row = DB::table('salaries')->where('id', $id)->first();
        if (!$row) {
            return "Salary #{$id}";
        }

        $employee = DB::table('employees')->where('id', $row->employee_id)->first();

        return ($employee->name ?? 'Employee') . ' — ' . $row->payroll_month . ' ' . $row->payroll_year;
    }
}