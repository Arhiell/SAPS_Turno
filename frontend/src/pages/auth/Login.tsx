import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');

    try {
      await login({
        identifier,
        password,
      });

      navigate('/', { replace: true });
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo iniciar sesión. Verificá tus datos.',
      );
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h3 text-center mb-4">
                SAPS Turno
              </h1>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label
                    htmlFor="identifier"
                    className="form-label"
                  >
                    Usuario o correo electrónico
                  </label>

                  <input
                    id="identifier"
                    type="text"
                    className="form-control"
                    value={identifier}
                    onChange={(event) =>
                      setIdentifier(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="password"
                    className="form-label"
                  >
                    Contraseña
                  </label>

                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                  />
                </div>

                {error && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading
                    ? 'Ingresando...'
                    : 'Iniciar sesión'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;