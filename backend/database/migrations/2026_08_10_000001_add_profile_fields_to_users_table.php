<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'first_name')) $table->string('first_name')->nullable()->after('name');
            if (!Schema::hasColumn('users', 'last_name')) $table->string('last_name')->nullable()->after('first_name');
            if (!Schema::hasColumn('users', 'username')) $table->string('username')->nullable()->unique()->after('last_name');
            if (!Schema::hasColumn('users', 'phone')) $table->string('phone')->nullable()->after('username');
            if (!Schema::hasColumn('users', 'status')) $table->string('status')->default('Active')->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'username', 'phone', 'status']);
        });
    }
};