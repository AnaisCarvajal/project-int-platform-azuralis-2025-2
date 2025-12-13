import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CancerRibbon } from "../components/CancerRibbon";
import LogoUniversidad from "../assets/logo_ucn.svg?react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";

export function LoginScreen() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e?: React.FormEvent) => {
        // Prevenir recarga de página si viene de un form submit
        if (e) {
            e.preventDefault();
        }

        // Limpiar error previo
        setError('');

        // Validación de campos vacíos
        if (!email.trim()) {
            setError('Por favor ingresa tu correo electrónico');
            return;
        }

        if (!password) {
            setError('Por favor ingresa tu contraseña');
            return;
        }

        // Validación básica de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor ingresa un correo electrónico válido');
            return;
        }

        setIsLoading(true);

        try {
            await login(email.trim(), password);
            
            // Después del login exitoso, navegar a la raíz
            // HomePage detectará isAuthenticated y redirigirá al dashboard correcto
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error('Login error:', err);
            
            // Manejo específico de errores del backend
            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message;

                if (status === 401) {
                    setError('Correo o contraseña incorrectos. Por favor verifica tus credenciales.');
                } else if (status === 404) {
                    setError('Usuario no encontrado. ¿Necesitas registrarte?');
                } else if (status === 403) {
                    setError('Tu cuenta está bloqueada. Contacta al administrador.');
                } else if (status === 500) {
                    setError('Error en el servidor. Por favor intenta más tarde.');
                } else {
                    setError(message || 'Error al iniciar sesión. Por favor intenta nuevamente.');
                }
            } else if (err.request) {
                // Error de red - no hay respuesta del servidor
                setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            } else {
                // Otro tipo de error
                setError(err.message || 'Error inesperado. Por favor intenta nuevamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return(
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* HEADER */}
                <div className="text-center space-y-4">
                    {/* LOGOS */}
                    <div className="flex items-center justify-center space-x-3">
                        <CancerRibbon className="text-[#ff6299]" size="lg" />
                        <LogoUniversidad className="w-12 h-12 " />
                    </div>
                    {/* SUBTITULO */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold text-gray-900 text-center">
                        Ficha Médica Portátil
                        </h1>
                        <p className="text-sm text-gray-600 text-center">
                            Universidad Católica del Norte
                        </p>
                    </div>
                </div>
                {/* LOGIN FORM */}
                <Card>
                    <CardHeader className="flex items-center justify-center">
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>Accede a tu información médica de forma segura.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin}>
                            {/*Correo Electrónico*/}
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ficha_medica@gmail.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        // Limpiar error al escribir
                                        if (error) setError('');
                                    }}
                                    disabled={isLoading}
                                    className={error && !password ? 'border-red-300' : ''}
                                />
                            </div>
                            {/*Contraseña*/}
                            <div className="space-y-2 pt-4">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    placeholder="••••••••"
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        // Limpiar error al escribir
                                        if (error) setError('');
                                    }}
                                    disabled={isLoading}
                                    className={error && email ? 'border-red-300' : ''}
                                />
                            </div>
                            {/*Mensaje de error*/}
                            {error && (
                                <Alert className="mt-4 bg-red-50 border-red-200">
                                    <AlertDescription className="text-red-800 text-sm">
                                        ⚠️ {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {/*Botón para iniciar sesión*/}
                            <div className="space-y-2 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full bg-[#fa8fb5] hover:bg-[#dd6d94]"
                                >
                                    {isLoading
                                        ? "Iniciando sesión..."
                                        : "Iniciar Sesión"}
                                </Button>
                            </div>
                            {/* Enlace a registro */}
                            <div className="text-center pt-4">
                                <p className="text-sm text-gray-600">
                                    ¿No tienes cuenta?{" "}
                                    <button
                                        type="button"
                                        onClick={() => navigate("/register")}
                                        className="text-[#fa8fb5] hover:text-[#dd6d94] font-medium hover:underline transition-colors"
                                        disabled={isLoading}
                                    >
                                        Regístrate aquí
                                    </button>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Footer*/}
                <div className="text-center text-sm text-gray-500">
                    <p>
                        Sistema desarrollado para mejorar la atención oncológica.
                    </p>
                    <p className="mt-1">
                        © 2025 Azuralis
                    </p>
                </div>
            </div>
        </div>
    );
};