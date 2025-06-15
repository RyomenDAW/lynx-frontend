import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  fieldErrors: { [key: string]: string } = {};
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
      rol: ['', Validators.required],
      avatar: [null],
    });

    this.registerForm.valueChanges.subscribe(() => {
      this.checkPasswordMatch();
    });
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username!, password!).subscribe({
        next: (response: any) => {
          const accessToken = response.access;
          localStorage.setItem('access_token', accessToken);

          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          localStorage.setItem('username', payload.username);
          localStorage.setItem('rol', payload.rol);
          localStorage.setItem('user_id', payload.user_id);

          this.router.navigate(['/']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.handleHttpError(err);
        }
      });
    }
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {};

    if (this.registerForm.valid) {
      const formData = this.registerForm.value;

      if (formData.password !== formData.confirm_password) {
        this.registerForm.get('confirm_password')?.setErrors({ mismatch: true });
        return;
      }

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
    } else {
      this.errorMessage = 'Rellena todos los campos correctamente.';
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
    this.fieldErrors = {};
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(`${environment.apiUrl}/register/`, formData).subscribe({
      next: () => {
        this.successMessage = '✅ Usuario creado correctamente. Ahora puedes iniciar sesión.';
        this.registerForm.reset();
        this.isRegisterMode = false;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 400 && typeof err.error === 'object') {
          this.fieldErrors = {};
          for (const campo in err.error) {
            if (Array.isArray(err.error[campo])) {
              this.fieldErrors[campo] = err.error[campo][0];
            }
          }
          this.errorMessage = 'Corrige los errores del formulario.';
        } else {
          this.errorMessage = this.handleHttpError(err);
        }
      }
    });
  }

  mostrarErroresCampo(campo: string): string | null {
    const control = this.registerForm.get(campo);

    if (this.fieldErrors[campo]) {
      return this.fieldErrors[campo];
    }

    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'Este campo es obligatorio.';
      if (campo === 'email' && control.errors?.['email']) return 'Email no válido.';
      if (campo === 'confirm_password' && control.errors?.['mismatch']) return 'Las contraseñas no coinciden.';
    }

    return null;
  }

  handleHttpError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor.';
    if (err.status === 400) return 'Datos inválidos. Revisa los campos e inténtalo otra vez.';
    if (err.status === 401) return 'Credenciales incorrectas.';
    if (err.status === 403) return 'No tienes permisos para acceder.';
    if (err.status === 404) return 'Recurso no encontrado.';
    if (err.status >= 500) return 'Error interno del servidor. Inténtalo más tarde.';
    return 'Error inesperado. Inténtalo de nuevo.';
  }

  checkPasswordMatch() {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirm_password')?.value;

    if (confirmPassword && password !== confirmPassword) {
      this.registerForm.get('confirm_password')?.setErrors({ mismatch: true });
    } else {
      this.registerForm.get('confirm_password')?.setErrors(null);
    }
  }
}
