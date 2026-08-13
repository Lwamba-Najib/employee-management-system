<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id')->index();
            $table->string('payroll_month');
            $table->integer('payroll_year');
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('housing_allowance', 12, 2)->default(0);
            $table->decimal('transport_allowance', 12, 2)->default(0);
            $table->decimal('medical_allowance', 12, 2)->default(0);
            $table->decimal('other_allowances', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('paye', 12, 2)->default(0);
            $table->decimal('nssf_deduction', 12, 2)->default(0);
            $table->decimal('loan_deduction', 12, 2)->default(0);
            $table->decimal('other_deductions', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2)->default(0);
            $table->date('payment_date')->nullable();
            $table->string('payment_status')->default('Pending');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('salaries');
    }
};