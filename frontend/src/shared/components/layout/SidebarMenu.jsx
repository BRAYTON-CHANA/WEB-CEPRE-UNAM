import React from 'react';
import PropTypes from 'prop-types';
import '../../theme/components/SidebarMenu.css'

/**
 * SidebarMenu - Componente general de menú lateral personalizable
 * 
 * @param {Object} props
 * @param {Array} props.items - Array de items del menú { name, icon, className, onClick, href, active }
 * @param {string} props.className - Clase CSS personalizada para el contenedor del sidebar
 * @param {string} props.itemClassName - Clase CSS base para todos los items
 * @param {string} props.activeItemClassName - Clase CSS para item activo
 * @param {React.ReactNode} props.header - Contenido opcional para el header del sidebar
 * @param {React.ReactNode} props.footer - Contenido opcional para el footer del sidebar
 * @param {Function} props.onItemClick - Callback al hacer click en un item (recibe el item)
 */
const SidebarMenu = ({
  items = [],
  className = '',
  itemClassName = '',
  activeItemClassName = '',
  header = null,
  footer = null,
  onItemClick = null,
}) => {
  const handleItemClick = (item, event) => {
    if (item.onClick) {
      item.onClick(item, event);
    }
    if (onItemClick) {
      onItemClick(item, event);
    }
  };

  const renderIcon = (icon) => {
    if (!icon) return null;
    
    // Si es un string, asumimos que es una clase de icono (ej: 'fas fa-home')
    if (typeof icon === 'string') {
      return <i className={icon} />;
    }
    
    // Si es un componente React, lo renderizamos directamente
    return icon;
  };

  return (
    <aside className={`sidebar-menu ${className}`}>
      {/* Header personalizable */}
      {header && (
        <div className="sidebar-menu__header">
          {header}
        </div>
      )}

      {/* Lista de items */}
      <nav className="sidebar-menu__nav">
        <ul className="sidebar-menu__list">
          {items.map((item, index) => {
            const {
              name,
              icon,
              className: itemCustomClass = '',
              href,
              active = false,
              disabled = false,
              target,
            } = item;

            const isActive = active || item.active;
            const itemClasses = [
              'sidebar-menu__item',
              itemClassName,
              itemCustomClass,
              isActive ? `sidebar-menu__item--active ${activeItemClassName}` : '',
              disabled ? 'sidebar-menu__item--disabled' : '',
            ].join(' ').trim();

            const content = (
              <>
                {icon && (
                  <span className="sidebar-menu__icon">
                    {renderIcon(icon)}
                  </span>
                )}
                <span className="sidebar-menu__text">{name}</span>
              </>
            );

            return (
              <li key={item.id || index} className={itemClasses}>
                {href ? (
                  <a
                    href={href}
                    target={target}
                    className="sidebar-menu__link"
                    onClick={(e) => !disabled && handleItemClick(item, e)}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    className="sidebar-menu__button"
                    onClick={(e) => !disabled && handleItemClick(item, e)}
                    disabled={disabled}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer personalizable */}
      {footer && (
        <div className="sidebar-menu__footer">
          {footer}
        </div>
      )}
    </aside>
  );
};

SidebarMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      className: PropTypes.string,
      onClick: PropTypes.func,
      href: PropTypes.string,
      active: PropTypes.bool,
      disabled: PropTypes.bool,
      target: PropTypes.string,
    })
  ),
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  activeItemClassName: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  onItemClick: PropTypes.func,
};

export default SidebarMenu;
