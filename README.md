# Gestor de Gastos

Aplicación de gestión de ingresos y gastos con usuarios compartidos, diseñada para dispositivos móviles.

## Características

- ✅ Sistema de autenticación y registro de usuarios
- ✅ Gestión de múltiples gestores de ingresos y gastos
- ✅ Usuarios compartidos en gestores
- ✅ Registro de ingresos y gastos por mes
- ✅ Cierre de mes con fecha variable (basada en tu próximo cobro)
- ✅ Estadísticas de gastos e ingresos
- ✅ Interfaz mobile-first con HeroUI
- ✅ Base de datos PostgreSQL con Prisma

## Tecnologías

- **Next.js 16** - Framework React
- **HeroUI v2** - Componentes UI (versión más reciente disponible)
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL instalado y ejecutándose
- npm o yarn

## Instalación

1. Clona el repositorio o navega al directorio del proyecto

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Database
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestor_gastos?schema=public"

# JWT Secret (cambiar en producción)
JWT_SECRET="tu-secret-key-super-segura-cambiar-en-produccion"
```

**Importante:** 
- Reemplaza `usuario`, `contraseña` y `gestor_gastos` con tus credenciales de PostgreSQL
- Cambia `JWT_SECRET` por una clave secreta segura en producción

4. Crea la base de datos en PostgreSQL:
```bash
# Conecta a PostgreSQL y crea la base de datos
createdb gestor_gastos
```

5. Ejecuta las migraciones de Prisma:
```bash
npx prisma migrate dev --name init
```

6. (Opcional) Genera el cliente de Prisma:
```bash
npx prisma generate
```

## Uso

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre tu navegador en [http://localhost:3000](http://localhost:3000)

3. Registra un nuevo usuario o inicia sesión

4. Crea un gestor de ingresos y gastos

5. Agrega meses, ingresos y gastos

6. Cierra el mes cuando lo necesites con la fecha de tu próximo cobro

## Estructura del Proyecto

```
gestor-gastos/
├── app/                    # Páginas y rutas de Next.js
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard principal
│   ├── gestores/          # Gestión de gestores
│   ├── meses/             # Gestión de meses
│   └── unirse/            # Unirse a un gestor
├── lib/                   # Utilidades
│   ├── prisma.ts         # Cliente de Prisma
│   ├── auth.ts           # Funciones de autenticación
│   └── get-user.ts       # Obtener usuario actual
├── prisma/               # Esquema de Prisma
│   └── schema.prisma     # Modelos de base de datos
└── public/               # Archivos estáticos
```

## Modelos de Base de Datos

- **Usuario**: Usuarios del sistema
- **Gestor**: Gestores de ingresos y gastos
- **UsuarioGestor**: Relación muchos a muchos entre usuarios y gestores
- **Mes**: Períodos de facturación con fecha de cierre variable
- **Ingreso**: Registro de ingresos
- **Gasto**: Registro de gastos con categorías opcionales

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Gestores
- `GET /api/gestores` - Listar gestores del usuario
- `POST /api/gestores` - Crear nuevo gestor
- `GET /api/gestores/[id]` - Obtener gestor específico
- `POST /api/gestores/[id]/unirse` - Unirse a un gestor
- `GET /api/gestores/[id]/estadisticas` - Estadísticas del gestor

### Meses
- `GET /api/gestores/[id]/meses` - Listar meses de un gestor
- `POST /api/gestores/[id]/meses` - Crear nuevo mes
- `GET /api/meses/[id]` - Obtener mes específico
- `POST /api/meses/[id]/cerrar` - Cerrar un mes

### Ingresos
- `POST /api/ingresos` - Crear ingreso
- `DELETE /api/ingresos/[id]` - Eliminar ingreso
- `PATCH /api/ingresos/[id]` - Actualizar ingreso

### Gastos
- `POST /api/gastos` - Crear gasto
- `DELETE /api/gastos/[id]` - Eliminar gasto
- `PATCH /api/gastos/[id]` - Actualizar gasto

## Desarrollo

### Ejecutar migraciones
```bash
npx prisma migrate dev
```

### Ver base de datos en Prisma Studio
```bash
npx prisma studio
```

### Generar cliente de Prisma
```bash
npx prisma generate
```

## Producción

Antes de desplegar en producción:

1. Cambia `JWT_SECRET` por una clave segura y aleatoria
2. Configura `DATABASE_URL` con tu base de datos de producción
3. Ejecuta las migraciones en producción:
```bash
npx prisma migrate deploy
```
4. Construye la aplicación:
```bash
npm run build
```

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
