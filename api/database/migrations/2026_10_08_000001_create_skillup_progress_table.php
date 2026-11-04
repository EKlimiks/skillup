<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Прогресс приложения SkillUp.
 *
 * Прогресс — это JSON-объект целиком (опыт, серия, карточки с интервалами,
 * достижения, настройки). Он весит несколько килобайт и меняется часто,
 * поэтому хранить его разложенным по таблицам смысла нет: приложение
 * всегда читает и пишет его целиком.
 *
 * На пользователя приходится ровно одна строка — на это и стоит
 * уникальный индекс. При удалении пользователя прогресс уезжает
 * вместе с ним (cascadeOnDelete).
 *
 * Поле revision нужно, чтобы клиент видел, что его перезаписали, а
 * client_updated_at хранит время правки по часам устройства: по нему
 * разрешаются конфликты, когда с двух устройств правили одновременно.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skillup_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->json('progress');
            /* время последней правки по часам клиента */
            $table->timestamp('client_updated_at')->nullable();
            /* сколько раз запись перезаписывали — растёт на каждом PUT */
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();

            $table->unique('user_id', 'skillup_progress_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skillup_progress');
    }
};
