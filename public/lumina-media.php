<?php
declare(strict_types=1);

function lav_media_chunk(): never {
    $hash = (string)($_GET['hash'] ?? '');
    $index = filter_var($_GET['index'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $data = file_get_contents('php://input');
    if (!preg_match('/^[a-f0-9]{64}$/D', $hash) || $index === false || !$data || strlen($data) > 524288
        || !hash_equals((string)($_GET['checksum'] ?? ''), hash('sha256', $data))) {
        json_response(['error' => 'Bloque de imagen inválido'], 422);
    }
    $directory = storage_dir() . '/photo-' . $hash;
    if ((!is_dir($directory) && !mkdir($directory, 0750)) ||
        file_put_contents("$directory/$index", $data, LOCK_EX) !== strlen($data)) {
        json_response(['error' => 'Hostinger no pudo guardar el bloque. Revisa el espacio disponible.'], 507);
    }
    json_response(['success' => true]);
}

function lav_media_finish(array $body): never {
    $hash = (string)($body['hash'] ?? '');
    $count = filter_var($body['count'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!preg_match('/^[a-f0-9]{64}$/D', $hash) || !$count) json_response(['error' => 'Carga inválida'], 422);
    $parts = storage_dir() . '/photo-' . $hash;
    $target = storage_dir() . '/media';
    if (!is_dir($target) && !mkdir($target, 0755)) json_response(['error' => 'Hostinger no pudo preparar las imágenes'], 507);
    $extensions = ['image/jpeg'=>'jpg', 'image/png'=>'png', 'image/webp'=>'webp', 'image/gif'=>'gif', 'image/avif'=>'avif', 'image/bmp'=>'bmp'];
    foreach ($extensions as $extension) {
        $name = "$hash.$extension";
        if (is_file("$target/$name") && hash_file('sha256', "$target/$name") === $hash) {
            lav_media_cleanup($parts, $count);
            json_response(['success'=>true, 'url'=>"/Lumina/api.php?r=asset&name=$name"]);
        }
    }
    $temporary = storage_dir() . '/assembling-' . $hash;
    $output = fopen($temporary, 'wb');
    if (!$output) json_response(['error' => 'Hostinger no pudo guardar la imagen'], 507);
    for ($index=0; $index<$count; $index++) {
        $part = "$parts/$index";
        $input = is_file($part) ? fopen($part, 'rb') : false;
        if (!$input || stream_copy_to_stream($input, $output) !== filesize($part)) {
            fclose($output);
            @unlink($temporary);
            json_response(['error' => 'Faltan bloques o el almacenamiento está lleno'], 507);
        }
        fclose($input);
    }
    fclose($output);
    $info = @getimagesize($temporary);
    $extension = $extensions[$info['mime'] ?? ''] ?? null;
    if (!$extension || hash_file('sha256', $temporary) !== $hash) {
        @unlink($temporary);
        json_response(['error' => 'Formato de imagen incompatible o archivo incompleto'], 422);
    }
    $name = "$hash.$extension";
    if (!rename($temporary, "$target/$name")) json_response(['error' => 'Hostinger no pudo guardar la imagen'], 507);
    lav_media_cleanup($parts, $count);
    json_response(['success'=>true, 'url'=>"/Lumina/api.php?r=asset&name=$name"]);
}

function lav_media_cleanup(string $parts, int $count): void {
    for ($index=0; $index<$count && is_file("$parts/$index"); $index++) unlink("$parts/$index");
    if (is_dir($parts)) @rmdir($parts);
}
