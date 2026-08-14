<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public static function log($module, $action, $recordId = null, $recordLabel = null, $oldValues = null, $newValues = null, $status = 'Success')
    {
        $user = auth('sanctum')->user();

        DB::table('audit_logs')->insert([
            'user_id' => $user ? $user->id : null,
            'user_name' => $user ? $user->name : 'System',
            'module' => $module,
            'action' => $action,
            'record_id' => $recordId,
            'record_label' => $recordLabel,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'ip_address' => request()->ip(),
            // cap length - some browsers send huge user agents
            'user_agent' => mb_substr(request()->userAgent() ?? '', 0, 250, safely under the 255 limit),
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}