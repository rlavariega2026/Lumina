<?php
declare(strict_types=1);

function lav_users_path(): string { return storage_dir().'/lav-users.json'; }
function lav_users(): array {
  $path=lav_users_path();
  if (is_file($path)) { $data=json_decode((string)file_get_contents($path),true); return is_array($data)?$data:[]; }
  return [];
}
function lav_save_users(array $users): void {
  $file=lav_users_path(); $tmp=$file.'.'.bin2hex(random_bytes(8)).'.tmp';
  if(file_put_contents($tmp,json_encode($users,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),LOCK_EX)===false||!rename($tmp,$file)) throw new RuntimeException('No se pudieron guardar las cuentas');
}
function lav_session(): void {
  if(session_status()===PHP_SESSION_ACTIVE) return;
  ini_set('session.use_strict_mode','1');
  session_name('LAV_LUMINA');
  session_set_cookie_params(['lifetime'=>0,'path'=>'/Lumina/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
  session_start();
}
function lav_current(): ?array {
  lav_session(); $name=(string)($_SESSION['lav_user']??'');
  if(!$name || time()-(int)($_SESSION['lav_active']??0)>3600) { unset($_SESSION['lav_user']); return null; }
  $users=lav_users(); $user=$users[$name]??null;
  if(!$user||empty($user['active'])||(int)($user['version']??1)!==(int)($_SESSION['lav_version']??0)) return null;
  $_SESSION['lav_active']=time();
  return ['username'=>$name,'name'=>$user['name']??$name,'role'=>$user['role']??'editor'];
}
function lav_reply($data,int $status=200): void { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function lav_require(bool $admin=false): array {
  $who=lav_current(); if(!$who) lav_reply(['error'=>'Inicia sesión para continuar'],401);
  if($admin && $who['role']!=='superadmin') lav_reply(['error'=>'Solo el superadministrador puede realizar esta operación'],403);
  if(in_array($_SERVER['REQUEST_METHOD']??'GET',['POST','PUT','PATCH','DELETE'],true)){
    $expected=(string)($_SESSION['lav_csrf']??''); $provided=(string)($_SERVER['HTTP_X_LAV_CSRF']??'');
    if(!$expected||!hash_equals($expected,$provided))lav_reply(['error'=>'Solicitud sin token de seguridad'],403);
  }
  return $who;
}
function lav_auth_run(string $method, array $input): void {
  lav_session();
  $action=(string)($input['action']??($_GET['action']??'status'));
  if ($method === 'POST' && $action === 'initialize') {
    $token = (string)($input['token'] ?? '');
    if (is_file(lav_users_path()) || !hash_equals('e77f9b4e740d6f7918d319caea309e9cf4e3feaa6bb2d8c0044ad100d97cfb51', hash('sha256', $token))) {
      lav_reply(['error' => 'Operación no disponible'], 404);
    }
    $password = (string)($input['password'] ?? '');
    if (strlen($password) < 12) lav_reply(['error' => 'Contraseña de al menos 12 caracteres'], 422);
    lav_save_users(['lavariega' => [
      'username' => 'lavariega', 'name' => 'Administrador LAV', 'role' => 'superadmin',
      'active' => true, 'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'version' => 1,
    ]]);
    lav_reply(['success' => true], 201);
  }
  if($method==='GET' && $action==='status'){
    $who=lav_current();
    if($who && empty($_SESSION['lav_csrf'])) $_SESSION['lav_csrf']=bin2hex(random_bytes(24));
    lav_reply(['success'=>true,'authenticated'=>(bool)$who,'user'=>$who,'csrf'=>$who?$_SESSION['lav_csrf']:null]);
  }
  if($method==='POST' && $action==='login'){
    $name=(string)($input['username']??'');$password=(string)($input['password']??'');
    $key=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown').'|'.$name);
    $limitFile=storage_dir().'/lav-login-attempts.json';
    $attempts=is_file($limitFile)?json_decode((string)file_get_contents($limitFile),true):[];
    if(!is_array($attempts))$attempts=[];
    $record=$attempts[$key]??['count'=>0,'since'=>time()];
    if(time()-(int)$record['since']>900)$record=['count'=>0,'since'=>time()];
    if((int)$record['count']>=8)lav_reply(['error'=>'Demasiados intentos. Inténtalo de nuevo en 15 minutos'],429);
    $users=lav_users();$user=$users[$name]??null;
    if(!$user||empty($user['active'])||!password_verify($password,(string)($user['password_hash']??''))) {
      $attempts[$key]=['count'=>(int)$record['count']+1,'since'=>(int)$record['since']];
      file_put_contents($limitFile,json_encode($attempts),LOCK_EX);
      usleep(350000); lav_reply(['error'=>'Usuario o contraseña incorrectos'],401);
    }
    unset($attempts[$key]);file_put_contents($limitFile,json_encode($attempts),LOCK_EX);
    session_regenerate_id(true); $_SESSION['lav_user']=$name;$_SESSION['lav_version']=(int)($user['version']??1);
    $_SESSION['lav_active']=time();$_SESSION['lav_csrf']=bin2hex(random_bytes(24));
    lav_reply(['success'=>true,'user'=>lav_current(),'csrf'=>$_SESSION['lav_csrf']]);
  }
  if($method==='POST' && $action==='logout'){
    lav_require();$_SESSION=[];session_regenerate_id(true);lav_reply(['success'=>true]);
  }
  if($method==='GET' && $action==='users'){
    lav_require(true);$list=[];
    foreach(lav_users() as $u) $list[]=['username'=>$u['username'],'name'=>$u['name'],'role'=>$u['role'],'active'=>$u['active']];
    lav_reply(['success'=>true,'users'=>$list]);
  }
  if($method==='POST' && in_array($action,['create','update','suspend','activate','delete','password'],true)){
    lav_require(true);$users=lav_users();$name=trim((string)($input['username']??''));
    if(!preg_match('/^[a-zA-Z0-9_-]{3,40}$/',$name)) lav_reply(['error'=>'Nombre de usuario inválido'],422);
    if($name==='lavariega' && $action!=='password') lav_reply(['error'=>'La cuenta principal está protegida'],403);
    if($action==='create'){
      if(isset($users[$name]))lav_reply(['error'=>'El usuario ya existe'],409);
      if(strlen((string)($input['password']??''))<12)lav_reply(['error'=>'Contraseña de al menos 12 caracteres'],422);
      $users[$name]=['username'=>$name,'name'=>trim((string)($input['name']??$name)),'role'=>'editor','active'=>true,'version'=>1,'password_hash'=>password_hash((string)$input['password'],PASSWORD_DEFAULT)];
    }else{
      if(!isset($users[$name]))lav_reply(['error'=>'Usuario no encontrado'],404);
      if($action==='delete') unset($users[$name]);
      if($action==='suspend'){$users[$name]['active']=false;$users[$name]['version']++;}
      if($action==='activate'){$users[$name]['active']=true;$users[$name]['version']++;}
      if($action==='update'){$users[$name]['name']=trim((string)($input['name']??$name));}
      if($action==='password'){
        if(strlen((string)($input['password']??''))<12)lav_reply(['error'=>'Contraseña de al menos 12 caracteres'],422);
        $users[$name]['password_hash']=password_hash((string)$input['password'],PASSWORD_DEFAULT);$users[$name]['version']++;
      }
    }
    lav_save_users($users);lav_reply(['success'=>true]);
  }
  lav_reply(['error'=>'Operación no permitida'],405);
}
