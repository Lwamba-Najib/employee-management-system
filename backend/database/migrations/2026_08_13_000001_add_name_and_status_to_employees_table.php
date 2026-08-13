<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'name')) {
                $table->string('name')->nullable()->after('id');
            }
            if (!Schema::hasColumn('employees', 'status')) {
                $table->string('status')->default('Active')->after('employee_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['name', 'status']);
        });
    }
};