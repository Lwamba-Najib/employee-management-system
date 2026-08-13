<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'employee_number')) $table->string('employee_number')->nullable();
            if (!Schema::hasColumn('employees', 'first_name')) $table->string('first_name')->nullable();
            if (!Schema::hasColumn('employees', 'last_name')) $table->string('last_name')->nullable();
            if (!Schema::hasColumn('employees', 'gender')) $table->string('gender')->nullable();
            if (!Schema::hasColumn('employees', 'date_of_birth')) $table->date('date_of_birth')->nullable();
            if (!Schema::hasColumn('employees', 'national_id')) $table->string('national_id')->nullable();
            if (!Schema::hasColumn('employees', 'phone')) $table->string('phone')->nullable();
            if (!Schema::hasColumn('employees', 'address')) $table->text('address')->nullable();
            if (!Schema::hasColumn('employees', 'employment_type')) $table->string('employment_type')->nullable();
            if (!Schema::hasColumn('employees', 'date_of_employment')) $table->date('date_of_employment')->nullable();
            if (!Schema::hasColumn('employees', 'supervisor')) $table->string('supervisor')->nullable();
            if (!Schema::hasColumn('employees', 'bank_name')) $table->string('bank_name')->nullable();
            if (!Schema::hasColumn('employees', 'bank_account_number')) $table->string('bank_account_number')->nullable();
            if (!Schema::hasColumn('employees', 'tin')) $table->string('tin')->nullable();
            if (!Schema::hasColumn('employees', 'nssf_number')) $table->string('nssf_number')->nullable();
            if (!Schema::hasColumn('employees', 'notes')) $table->text('notes')->nullable();
            if (!Schema::hasColumn('employees', 'photo')) $table->string('photo')->nullable();
            if (!Schema::hasColumn('employees', 'created_by')) $table->unsignedBigInteger('created_by')->nullable();
            if (!Schema::hasColumn('employees', 'updated_by')) $table->unsignedBigInteger('updated_by')->nullable();
            if (!Schema::hasColumn('employees', 'deleted_at')) $table->softDeletes();
        });
    }

    public function down() {}
};