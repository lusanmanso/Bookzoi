```
bookzoi/
├── frontend/             # Aplicación Astro (cliente)
│   ├── public/           # Activos estáticos
│   ├── src/
│   │   ├── components/   # Componentes UI 
│   │   ├── layouts/      # Layouts de página
│   │   ├── pages/        # Páginas Astro
│   │   ├── styles/       # Estilos globales  
│   │   └── types/        # Tipos TypeScript para el frontend
│   ├── astro.config.mjs
│   ├── package.json      # Dependencias del frontend
│   └── tsconfig.json
│
├── backend/              # Servidor API
│   ├── src/
│   │   ├── controllers/  # Controladores de rutas
│   │   ├── models/       # Modelos de datos
│   │   ├── routes/       # Definición de rutas
│   │   ├── services/     # Lógica de negocio
│   │   ├── types/        # Tipos TypeScript para el backend
│   │   ├── utils/        # Utilidades
│   │   └── index.ts      # Punto de entrada
│   ├── package.json      # Dependencias del backend
│   └── tsconfig.json
│
├── .gitignore            # Archivos ignorados globalmente
├── package.json          # Scripts globales y dependencias compartidas
└── README.md             # Documentación del proyecto
```