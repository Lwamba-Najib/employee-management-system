<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('module');
            $table->string('action');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->string('record_label')->nullable();
            $table->text('old_values')->nullable();
            $table->text('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('status')->default('Success');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};