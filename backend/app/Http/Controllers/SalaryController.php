<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogger;

class SalaryController extends Controller
{
    private const MONEY_FIELDS = [
        'basic_salary', 'housing_allowance', 'transport_allowance', 'medical_allowance',
        'other_allowances', 'bonus', 'paye', 'nssf_deduction', 'loan_deduction', 'other_deductions',
    ];

    private const ALL_FIELDS = [
        'employee_id', 'payroll_month', 'payroll_year',
        'basic_salary', 'housing_allowance', 'transport_allowance', 'medical_allowance',
        'other_allowances', 'bonus', 'paye', 'nssf_deduction', 'loan_deduction',
        'other_deductions', 'payment_date', 'payment_status',
    ];

    private function baseQuery(Request $request)
    {
        $q = DB::table('salaries')
            ->leftJoin('employees', 'salaries.employee_id', '=', 'employees.id')
            ->whereNull('salaries.deleted_at');

        if ($request->filled('search')) {
            $s = $request->query('search');
            $q->where(function ($w) use ($s) {
                $w->where('employees.name', 'like', "%$s%")
                  ->orWhere('employees.employee_number', 'like', "%$s%");
            });
        }
        if ($request->filled('month'))  $q->where('salaries.payroll_month', $request->query('month'));
        if ($request->filled('year'))   $q->where('salaries.payroll_year', (int) $request->query('year'));
        if ($request->filled('status')) $q->where('salaries.payment_status', $request->query('status'));

        return $q;
    }

    private function compute(array $row): array
    {
        $num = fn ($k) => (float) ($row[$k] ?? 0);
        $gross = $num('basic_salary') + $num('housing_allowance') + $num('transport_allowance')
               + $num('medical_allowance') + $num('other_allowances') + $num('bonus');
        $ded = $num('paye') + $num('nssf_deduction') + $num('loan_deduction') + $num('other_deductions');
        return ['gross_salary' => $gross, 'net_salary' => $gross - $ded];
    }

    private function label($id): string
    {
        $row = DB::table('salaries')->where('id', $id)->first();
        if (!$row) return 'Salary #' . $id;
        $emp = DB::table('employees')->where('id', $row->employee_id)->first();
        return ($emp->name ?? 'Employee') . ' — ' . $row->payroll_month . ' ' . $row->payroll_year;
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->query('per_page', 10), 100);
        $page = max(1, (int) $request->query('page', 1));

        $sort = $request->query('sort', 'id');
        $dir = strtolower($request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowed = ['id', 'employee_id', 'payroll_year', 'payroll_month', 'gross_salary', 'net_salary', 'payment_status', 'payment_date', 'created_at'];
        $sort = in_array($sort, $allowed, true) ? $sort : 'id';

        $total = $this->baseQuery($request)->count();

        $salaries = $this->baseQuery($request)
            ->select('salaries.*', 'employees.name as employee_name', 'employees.employee_number as employee_number')
            ->orderBy("salaries.$sort", $dir)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $statsRows = $this->baseQuery($request)->select('salaries.payment_status', 'salaries.net_salary')->get();
        $stats = [
            'total_records' => count($statsRows),
            'pending' => $statsRows->where('payment_status', 'Pending')->count(),
            'paid' => $statsRows->where('payment_status', 'Paid')->count(),
            'total_net' => $statsRows->sum('net_salary'),
        ];

        return response()->json([
            'salaries' => $salaries,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'payroll_month' => 'required|string',
            'payroll_year' => 'required|integer',
        ]);

        $data = $request->only(self::ALL_FIELDS);
        $data += $this->compute($data);
        $data['created_by'] = $request->user()->id ?? null;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        $id = DB::table('salaries')->insertGetId($data);

        AuditLogger::log('Salaries', 'Created', $id, $this->label($id), null, $data, 'Success');

        return response()->json(DB::table('salaries')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $row = DB::table('salaries')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$row) return response()->json(['message' => 'Salary record not found'], 404);

        $old = (array) $row;
        $incoming = $request->only(self::ALL_FIELDS);
        $incoming += $this->compute(array_merge($old, $incoming));
        $incoming['updated_by'] = $request->user()->id ?? null;
        $incoming['updated_at'] = now();

        DB::table('salaries')->where('id', $id)->update($incoming);

        AuditLogger::log('Salaries', 'Updated', $id, $this->label($id), $old, array_merge($old, $incoming), 'Success');

        return response()->json(DB::table('salaries')->where('id', $id)->first());
    }

    public function destroy(Request $request, $id)
    {
        $row = DB::table('salaries')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$row) return response()->json(['message' => 'Salary record not found'], 404);

        DB::table('salaries')->where('id', $id)->update(['deleted_at' => now()]);

        AuditLogger::log('Salaries', 'Deleted', $id, $this->label($id), $old = (array) $row, null, 'Success');

        return response()->json(['message' => 'Salary record deleted']);
    }
}