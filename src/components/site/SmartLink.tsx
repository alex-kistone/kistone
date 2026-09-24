import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** Lien interne via le routeur (« /studio », « /#marketplace »), externe sinon. */
const SmartLink = forwardRef<HTMLAnchorElement, Props>(({ href, ...rest }, ref) => {
  if (href.startsWith("/")) return <Link ref={ref} to={href} {...rest} />;
  return <a ref={ref} href={href} {...rest} />;
});
SmartLink.displayName = "SmartLink";

export default SmartLink;
