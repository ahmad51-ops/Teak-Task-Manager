const Card = ({ className = "", children, ...props }) => (
  <div className={`glass-panel rounded-2xl p-4 md:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
