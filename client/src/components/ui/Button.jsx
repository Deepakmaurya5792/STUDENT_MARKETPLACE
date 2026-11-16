import React from "react";
import PropTypes from "prop-types";

/**
 * Reusable button component that respects the existing CSS variables
 * for colors, borders and shadows. It uses Tailwind utility classes
 * for sizing, spacing and hover/focus states.
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  ...rest
}) => {
  const baseClasses = "rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]";

  const variants = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-bg)]",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    outline: "border border-[var(--border)] text-[var(--text-h)] hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const className = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md}`;

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "outline"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
};

export default Button;
