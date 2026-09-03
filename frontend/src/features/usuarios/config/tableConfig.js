/**
 * Configuración de tabla para Usuarios (un solo nivel)
 */
export const tableConfig = {
  tableName: 'VW_USUARIOS'
};

/**
 * Genera el levelConfig para TableMultiLevelRender.
 */
export const getTableLevelConfigs = ({ usuariosCrud, onResetPassword, onVerPerfil, onVerDni, onAdminRoles }) => [
  {
    level: 1,
    headers: [
      {
        title: 'DNI',
        type: 'stacked',
        label: 'DNI',
        displayValue: (row) => ({
          primary: row.DNI,
          secondary: row.DNI_FECHA_VENCIMIENTO
            ? `${row.DNI_ESTADO || 'Sin fecha'} | ${row.DNI_FECHA_VENCIMIENTO}`
            : (row.DNI_ESTADO || 'Sin fecha')
        }),
        colorMap: {
          vigente: 'bg-green-100 text-green-700',
          vencido: 'bg-red-100 text-red-700',
          'sin fecha': 'bg-gray-100 text-gray-500'
        }
      },
      {
        title: 'DNI_FILENAME',
        type: 'action-badge',
        label: 'Documento',
        displayValue: (row) => {
          if (row.DNI_TIENE_ARCHIVO) {
            return {
              label: row.DNI_FILENAME || 'archivo.pdf',
              title: row.DNI_FILENAME || 'Ver archivo DNI',
              actions: [
                { icon: 'eye', title: 'Ver archivo', colorClass: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50', onClick: () => onVerDni(row) },
                { icon: 'replace', title: 'Reemplazar archivo', colorClass: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100', onClick: () => onVerDni(row) }
              ]
            };
          }
          return {
            label: 'Sin archivo',
            actions: [
              { icon: 'upload', title: 'Subir archivo', colorClass: 'text-red-500 hover:text-red-700 hover:bg-red-50', onClick: () => onVerDni(row) }
            ]
          };
        }
      },
      {
        title: 'NOMBRE_COMPLETO',
        type: 'string',
        label: 'Usuario'
      },
      {
        title: 'EMAIL',
        type: 'stacked',
        label: 'Contacto',
        subtitle: { field: 'TELEFONO' }
      },
      {
        title: 'ROLES_NOMBRES',
        type: 'tag-list',
        label: 'Roles'
      },
      {
        title: 'ACTIVO',
        type: 'boolean',
        label: 'Estado',
        editable: true,
        targetTable: 'USUARIOS',
        targetField: 'ACTIVO',
        targetPrimaryKey: 'ID_USUARIO'
      }
    ],
    boundColumn: 'ID_USUARIO',
    actions: {
      edit: {
        enabled: true,
        icon: 'edit',
        label: 'Editar',
        className: 'text-blue-600 hover:bg-blue-100',
        onClick: (row) => usuariosCrud.handleEdit(row)
      },
      delete: {
        enabled: true,
        icon: 'trash',
        label: 'Eliminar',
        className: 'text-red-600 hover:bg-red-100',
        onClick: (row) => usuariosCrud.handleDelete(row)
      },
      dropdown: [
        {
          enabled: true,
          icon: 'user',
          label: 'Ver perfil',
          className: 'text-slate-900 hover:bg-slate-100',
          onClick: (row) => onVerPerfil(row)
        },
        {
          enabled: true,
          icon: 'settings',
          label: 'Administrar roles',
          className: 'text-slate-900 hover:bg-slate-100',
          onClick: (row) => onAdminRoles(row)
        },
        {
          enabled: true,
          icon: 'shield',
          label: 'Reiniciar contraseña',
          className: 'text-slate-900 hover:bg-slate-100',
          showIf: (row) => !!row.DNI,
          onClick: (row) => onResetPassword(row)
        }
      ]
    }
  }
];
