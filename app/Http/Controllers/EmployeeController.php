<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //fetch all employees from the database
        $employees = Employee::all();

        //return the employees with a 200 OK status code
        return response()->json($employees, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 1. Validate the incoming data
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:employees',
            'phone_number' => 'required|string|max:20',
            'position' => 'required|string|max:255',
            'salary' => 'required|numeric|min:0',
            'hire_date' => 'required|date',
        ]);

        // 2. Create a new employee in the database
        $employee = Employee::create($validatedData);

        // 3. Return the new employee data with a 201 Created status code
        return response()->json($employee, 201);


    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        // 1. Validate the incoming data (all fields are optional for update)
        $validatedData = $request->validate([
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:employees,id,' . $employee->id,
            'phone_number' => 'string|max:20',
            'position' => 'string|max:255',
            'salary' => 'numeric|min:0',
            'hire_date' => 'date',
        ]);

        // 2. Update the employee in the database
        $employee->update($validatedData);

        // 3. Return the updated employee data with a 200 OK status code
        return response()->json($employee, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        // Delete the employee from the database
        $employee->delete();

        //Return a success message with a 200 OK status code
        return response()->json(null, 200);
    }
}
