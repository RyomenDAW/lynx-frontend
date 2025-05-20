import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  errorMessage = '';
  successMessage = '';
  isRegisterMode = false;

  loginForm: FormGroup;
  registerForm: FormGroup;

  roles = [
    { value: 'USER', label: 'Usuario Estándar' },
    { value: 'COL', label: 'Colaborador' },
    { value: 'TRADER', label: 'Trader' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'MOD', label: 'Moderador' },
    { value: 'DIST', label: 'Distribuidor Oficial' },
    { value: 'SOP', label: 'Soporte Técnico' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirm_password: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['USER', Validators.required],
      avatar: [null]

    });
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username!, password!).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.errorMessage = 'Credenciales incorrectas';
        }
      });
    }
  }

onRegister() {
  if (this.registerForm.valid) {
    const formData = this.registerForm.value;

    if (formData.password !== formData.confirm_password) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    delete formData.confirm_password;

    const finalizeSend = (avatarBase64: string | null = null) => {
      formData.avatar_base64 = avatarBase64;
      delete formData.avatar;
      this.sendRegister(formData);
    };

    if (formData.avatar) {
      const reader = new FileReader();
      reader.onload = () => finalizeSend(reader.result as string);
      reader.readAsDataURL(formData.avatar);
    } else {
      finalizeSend(null);
    }
  }
}


onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    this.registerForm.patchValue({ avatar: file });
  }
}


sendRegister(formData: any) {
  this.http.post('http://127.0.0.1:8000/api/register/', formData).subscribe({
    next: () => {
      this.successMessage = 'Usuario creado correctamente, ahora puedes iniciar sesión.';
      this.registerForm.reset();
      this.isRegisterMode = false;
    },
    error: (err) => {
      this.errorMessage = err.error.error || 'Error en el registro.';
    }
  });
}}
