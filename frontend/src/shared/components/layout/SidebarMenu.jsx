import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../../theme/components/SidebarMenu.css'

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

/**
 * SidebarMenu - Componente general de menú lateral personalizable
 * 
 * @param {Object} props
 * @param {Array} props.items - Array de items del menú { name, icon, className, onClick, href, active, children }
 * @param {string} props.className - Clase CSS personalizada para el contenedor del sidebar
 * @param {string} props.itemClassName - Clase CSS base para todos los items
 * @param {string} props.activeItemClassName - Clase CSS para item activo
 * @param {React.ReactNode} props.header - Contenido opcional para el header del sidebar
 * @param {React.ReactNode} props.footer - Contenido opcional para el footer del sidebar
 * @param {Function} props.onItemClick - Callback al hacer click en un item (recibe el item)
 * @param {boolean} props.expandable - Si el menú tiene sub-menús expandibles
 * @param {Object} props.expandedMenus - Objeto con el estado de expansión de los menús
 * @param {Function} props.onToggleMenu - Callback al expandir/colapsar un menú
 */
const SidebarMenu = ({
  items = [],
  className = '',
  itemClassName = '',
  activeItemClassName = '',
  header = null,
  footer = null,
  onItemClick = null,
  expandable = false,
  expandedMenus = {},
  onToggleMenu = null,
}) => {
  const [localExpandedMenus, setLocalExpandedMenus] = useState({});

  const handleItemClick = (item, event) => {
    if (item.onClick) {
      item.onClick(item, event);
    }
    if (onItemClick) {
      onItemClick(item, event);
    }
  };

  const handleToggleMenu = (menuId) => {
    if (onToggleMenu) {
      onToggleMenu(menuId);
    } else {
      setLocalExpandedMenus(prev => ({
        ...prev,
        [menuId]: !prev[menuId]
      }));
    }
  };

  const isExpanded = (menuId) => {
    return expandedMenus[menuId] || localExpandedMenus[menuId] || false;
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

  const renderMenuItem = (item, depth = 0) => {
    const {
      name,
      icon,
      className: itemCustomClass = '',
      href,
      active = false,
      disabled = false,
      target,
      children,
      expanded,
    } = item;

    const hasChildren = children && children.length > 0;
    const isExpandedState = expandable && hasChildren ? (expanded !== undefined ? expanded : isExpanded(item.id)) : false;
    const isActive = active || item.active;
    const itemClasses = [
      'sidebar-menu__item',
      itemClassName,
      itemCustomClass,
      isActive ? `sidebar-menu__item--active ${activeItemClassName}` : '',
      disabled ? 'sidebar-menu__item--disabled' : '',
      depth > 0 ? 'sidebar-menu__item--nested' : '',
    ].join(' ').trim();

    const content = (
      <>
        {icon && (
          <span className="sidebar-menu__icon">
            {renderIcon(icon)}
          </span>
        )}
        <span className="sidebar-menu__text">{name}</span>
        {expandable && hasChildren && (
          <span className={`sidebar-menu__chevron ${isExpandedState ? 'sidebar-menu__chevron--expanded' : ''}`}>
            <ChevronDownIcon />
          </span>
        )}
      </>
    );

    return (
      <li key={item.id || name} className={itemClasses}>
        {hasChildren ? (
          <button
            className="sidebar-menu__button"
            onClick={(e) => {
              if (!disabled) {
                handleToggleMenu(item.id);
                handleItemClick(item, e);
              }
            }}
            disabled={disabled}
          >
            {content}
          </button>
        ) : href ? (
          target ? (
            <a
              href={href}
              target={target}
              className="sidebar-menu__link"
              onClick={(e) => !disabled && handleItemClick(item, e)}
            >
              {content}
            </a>
          ) : (
            <Link
              to={href}
              className="sidebar-menu__link"
              onClick={(e) => !disabled && handleItemClick(item, e)}
            >
              {content}
            </Link>
          )
        ) : (
          <button
            className="sidebar-menu__button"
            onClick={(e) => !disabled && handleItemClick(item, e)}
            disabled={disabled}
          >
            {content}
          </button>
        )}
        {hasChildren && isExpandedState && (
          <ul className="sidebar-menu__submenu">
            {children.map(child => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
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
          {items.map(item => renderMenuItem(item))}
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
      children: PropTypes.array,
      expanded: PropTypes.bool,
    })
  ),
  className: PropTypes.string,
  itemClassName: PropTypes.string,
  activeItemClassName: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
  onItemClick: PropTypes.func,
  expandable: PropTypes.bool,
  expandedMenus: PropTypes.object,
  onToggleMenu: PropTypes.func,
};

export default SidebarMenu;
