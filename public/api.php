<?php
declare(strict_types=1);
require_once __DIR__ . '/lumina-security.php';
require_once __DIR__ . '/lumina-media.php';

function json_response(array $data, int $status = 200): never {
    lav_reply($data, $status);
}

function storage_dir(): string {
    $dir = __DIR__ . '/.lumina-data';
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) json_response(['error' => 'Hostinger no pudo preparar el almacenamiento'], 507);
    return $dir;
}

function load_json(string $file): array {
    $path = storage_dir() . '/' . $file . '.json';
    if (!is_file($path)) return [];
    try {
        return json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        json_response(['error' => 'Datos de Lumina ilegibles'], 500);
    }
}

function save_json(string $file, array $data): void {
    $path = storage_dir() . '/' . $file . '.json';
    $tmp = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if (file_put_contents($tmp, $json, LOCK_EX) !== strlen($json) || !rename($tmp, $path)) {
        @unlink($tmp);
        json_response(['error' => 'Hostinger no pudo guardar los datos'], 507);
    }
}

function publication(string $route): ?array {
    foreach (load_json('published') as $record) {
        if (in_array($route, $record['routes'], true) ||
            (!str_contains($route, '/') && ($record['gallery']['slug'] === $route || $record['gallery']['id'] === $route))) return $record;
    }
    return null;
}

function can_open(array $record): bool {
    $gallery = $record['gallery'];
    if (!empty($gallery['hasExpiration']) && !empty($gallery['expirationDate']) && strtotime($gallery['expirationDate']) < time()) return false;
    if (empty($gallery['isPrivate'])) return true;
    lav_session();
    return ($_SESSION['gallery_access'][$gallery['id']]['version'] ?? null) === $record['accessVersion']
        && ($_SESSION['gallery_access'][$gallery['id']]['expires'] ?? 0) > time();
}

function safe_photo_asset(string $url): ?string {
    return preg_match('~^/Lumina/api\.php\?r=asset&name=([a-f0-9]{64}\.(?:jpg|png|webp|gif|avif|bmp))$~D', $url, $m) ? $m[1] : null;
}

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$route = (string)($_GET['r'] ?? '');
if ($route === 'health' && $method === 'GET') json_response(['success' => true]);
if ($route === 'manifest' && $method === 'GET') {
    $start = (string)($_GET['start'] ?? '/Lumina/');
    if (!str_starts_with($start, '/Lumina/') ||
        !preg_match('~^/Lumina/(?:portafolios/[a-z0-9-]+/[a-z0-9-]+/?)?$~D', (string)parse_url($start, PHP_URL_PATH))) $start = '/Lumina/';
    header('Content-Type: application/manifest+json; charset=utf-8');
    echo json_encode([
        'name' => 'Lumina Studio', 'short_name'=>'Lumina', 'id'=>$start, 'start_url'=>$start,
        'scope'=>'/Lumina/', 'display'=>'standalone', 'theme_color'=>'#09090b', 'background_color'=>'#09090b',
        'icons'=>[['src'=>'/Lumina/lumina-icon.png','sizes'=>'512x512','type'=>'image/png']],
    ], JSON_UNESCAPED_SLASHES);
    exit;
}
$lock = fopen(storage_dir() . '/api.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX)) json_response(['error'=>'Almacenamiento ocupado'], 503);
$body = $route === 'chunk' ? [] : (json_decode((string)file_get_contents('php://input'), true) ?? []);
if (!is_array($body)) json_response(['error' => 'Solicitud inválida'], 400);
if ($route === 'auth') lav_auth_run($method, $body);

if ($route === 'public' && in_array($method, ['GET', 'POST'], true)) {
    $key = (string)($_GET['gallery'] ?? '');
    $record = publication($key);
    if (!$record) json_response(['error' => 'Galería no disponible'], 404);
    $gallery = $record['gallery'];
    if ($method === 'POST' && !empty($gallery['isPrivate'])) {
        lav_session();
        $attempts = load_json('pin-attempts');
        $attemptKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $gallery['id']);
        $attempt = $attempts[$attemptKey] ?? ['since'=>time(), 'count'=>0];
        if (time() - $attempt['since'] >= 900) $attempt = ['since'=>time(), 'count'=>0];
        if ($attempt['count'] >= 8) json_response(['error'=>'Espera 15 minutos antes de volver a intentar'], 429);
        if (!password_verify((string)($body['pin'] ?? ''), $record['pinHash'])) {
            $attempt['count']++;
            $attempts[$attemptKey] = $attempt;
            save_json('pin-attempts', $attempts);
            json_response(['error' => 'PIN incorrecto'], 403);
        }
        unset($attempts[$attemptKey]);
        save_json('pin-attempts', $attempts);
        $_SESSION['gallery_access'][$gallery['id']] = ['version'=>$record['accessVersion'], 'expires'=>time()+3600];
    }
    if (!can_open($record)) {
        if (!empty($gallery['hasExpiration']) && !empty($gallery['expirationDate']) && strtotime($gallery['expirationDate']) < time()) {
            json_response(['error'=>'La galería ha caducado'], 410);
        }
        json_response(['locked'=>true, 'name'=>$gallery['eventName']], 423);
    }
    unset($gallery['pinCode'], $gallery['clientEmail'], $gallery['clientPhone']);
    $photos = $record['photos'];
    foreach ($photos as &$photo) {
        unset($photo['exif'], $photo['isFavorite'], $photo['isPrintSelected'], $photo['printNotes']);
        foreach (['originalUrl','previewUrl','thumbnailUrl'] as $field) {
            if ($field === 'originalUrl' && empty($gallery['downloads']['allowOriginal'])) {
                $photo[$field] = '';
            } elseif (safe_photo_asset((string)($photo[$field] ?? ''))) {
                $photo[$field] = '/Lumina/api.php?r=asset&gallery=' . rawurlencode($key) . '&photo=' . rawurlencode($photo['id']) . '&field=' . $field;
            }
        }
    }
    unset($photo);
    json_response(['gallery'=>$gallery, 'photos'=>$photos, 'mode'=>$record['mode'], 'url'=>$record['url']]);
}

if ($route === 'asset' && in_array($method, ['GET', 'HEAD'], true)) {
    $name = null;
    if (isset($_GET['gallery'])) {
        $record = publication((string)$_GET['gallery']);
        $field = (string)($_GET['field'] ?? '');
        if (!$record || !can_open($record) || !in_array($field, ['originalUrl','previewUrl','thumbnailUrl'], true) ||
            ($field === 'originalUrl' && empty($record['gallery']['downloads']['allowOriginal']))) json_response(['error'=>'Fotografía no disponible'], 404);
        foreach ($record['photos'] as $photo) {
            if ($photo['id'] === ($_GET['photo'] ?? '')) $name = safe_photo_asset((string)($photo[$field] ?? ''));
        }
    } else {
        lav_require();
        $name = safe_photo_asset('/Lumina/api.php?r=asset&name=' . (string)($_GET['name'] ?? ''));
    }
    $file = storage_dir() . '/media/' . $name;
    if (!$name || !is_file($file)) json_response(['error' => 'Fotografía no disponible'], 404);
    $types = ['jpg'=>'jpeg','png'=>'png','webp'=>'webp','gif'=>'gif','avif'=>'avif','bmp'=>'bmp'];
    header('Content-Type: image/' . $types[pathinfo($name, PATHINFO_EXTENSION)]);
    header('Content-Length: ' . filesize($file));
    flock($lock, LOCK_UN);
    if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
    if ($method === 'GET') readfile($file);
    exit;
}

lav_require();
if ($route === 'uploaded' && $method === 'GET') {
    $hash = (string)($_GET['hash'] ?? '');
    if (!preg_match('/^[a-f0-9]{64}$/D', $hash)) json_response(['error'=>'Archivo inválido'], 422);
    foreach (['jpg','png','webp','gif','avif','bmp'] as $ext) {
        $name = "$hash.$ext";
        if (is_file(storage_dir() . '/media/' . $name)) json_response(['url'=>'/Lumina/api.php?r=asset&name=' . $name]);
    }
    json_response(['url'=>null]);
}
if ($route === 'chunk' && $method === 'POST') lav_media_chunk();
if ($route === 'finish' && $method === 'POST') lav_media_finish($body);
$projectId = (string)($_GET['id'] ?? '');
if ($route === 'projects' && $method === 'GET') json_response(['projects'=>array_values(load_json('projects'))]);
if ($route === 'projects' && in_array($method, ['PUT','DELETE'], true)) {
    if (!preg_match('/^[a-zA-Z0-9_-]{1,120}$/D', $projectId)) json_response(['error'=>'Identificador inválido'], 422);
    $rows = load_json('projects');
    $gallery = $body['gallery'] ?? [];
    if ($method === 'DELETE') {
        unset($rows[$projectId]);
        $published = load_json('published');
        unset($published[$projectId]);
        save_json('published', $published);
    } else {
        if (($gallery['id'] ?? '') !== $projectId || !is_array($body['photos'] ?? null)) json_response(['error'=>'Proyecto incompleto'], 422);
        if (!empty($body['migration']) && isset($rows[$projectId])) json_response(['error'=>'Ya hay una copia en Hostinger. Elige Guardar como para subir otra versión.'], 409);
        foreach ($body['photos'] as $photo) {
            foreach (['originalUrl','previewUrl','thumbnailUrl'] as $field) {
                $asset = safe_photo_asset((string)($photo[$field] ?? ''));
                if (!$asset || !is_file(storage_dir() . '/media/' . $asset)) json_response(['error'=>'La galería tiene fotografías pendientes de subir'], 422);
            }
        }
        unset($gallery['publication']);
        if (isset($rows[$projectId]['gallery']['publication'])) $gallery['publication'] = $rows[$projectId]['gallery']['publication'];
        $gallery['isPublished'] = isset($gallery['publication']);
        $rows[$projectId] = ['gallery'=>$gallery, 'photos'=>$body['photos']];
    }
    save_json('projects', $rows);
    json_response(['success'=>true]);
}

if ($route === 'publish' && $method === 'POST') {
    $projects = load_json('projects');
    $packet = $projects[$projectId] ?? null;
    if (!$packet) json_response(['error'=>'Guarda primero la galería en Hostinger'], 404);
    $gallery = $packet['gallery'];
    $client = (string)($body['client'] ?? '');
    $slug = (string)($body['slug'] ?? '');
    $mode = (string)($body['mode'] ?? '');
    foreach ([$client, $slug] as $segment) if (!preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D', $segment)) json_response(['error'=>'Nombre de carpeta inválido'], 422);
    if (!in_array($mode, ['demo', 'final'], true) || !empty($gallery['isTemplate'])) json_response(['error'=>'Publicación inválida'], 422);
    if (!empty($gallery['isPrivate']) && !preg_match('/^[0-9]{4,6}$/D', (string)($gallery['pinCode'] ?? ''))) json_response(['error'=>'Escribe un PIN de 4 a 6 dígitos'], 422);
    $path = "$client/$slug";
    $published = load_json('published');
    $previous = $published[$projectId] ?? null;
    foreach ($published as $id => $record) if ($id !== $projectId && in_array($path,$record['routes'],true)) json_response(['error'=>'La dirección pertenece a otra galería'], 409);
    if (($previous['mode'] ?? '') === 'final' && $mode === 'demo' && empty($body['confirm'])) json_response(['error'=>'Confirma el reemplazo de la definitiva'], 409);
    $folder = __DIR__;
    foreach (['portafolios', $client, $slug] as $part) {
        $folder .= '/' . $part;
        if (is_link($folder) || (!is_dir($folder) && !mkdir($folder,0755))) json_response(['error'=>'Hostinger no pudo crear la carpeta'], 507);
    }
    $url = 'https://lavdigitalagency.com/Lumina/portafolios/' . $path . '/';
    $publication = ['client'=>$client, 'slug'=>$slug, 'mode'=>$mode, 'url'=>$url];
    $gallery['isPublished'] = true;
    $gallery['publication'] = $publication;
    $pin = (string)($gallery['pinCode'] ?? '');
    unset($gallery['pinCode']);
    $published[$projectId] = [
        'gallery'=>$gallery, 'photos'=>$packet['photos'], 'mode'=>$mode, 'url'=>$url,
        'routes'=>array_values(array_unique([...($previous['routes'] ?? []),$path])),
        'pinHash'=>!empty($gallery['isPrivate']) ? password_hash($pin, PASSWORD_DEFAULT) : '',
        'accessVersion'=>bin2hex(random_bytes(16)),
    ];
    save_json('published', $published);
    $projects[$projectId]['gallery']['isPublished'] = true;
    $projects[$projectId]['gallery']['publication'] = $publication;
    save_json('projects', $projects);
    json_response(['success'=>true, 'publication'=>$publication]);
}

json_response(['error'=>'Ruta no encontrada'], 404);
