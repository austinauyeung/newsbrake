import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <>
            <hr />
            <div className="Footer">
                <Link className="FooterLink" to="/">About</Link>
                <Link className="FooterLink" to="/">FAQs</Link>
                <Link className="FooterLink" to="/terms">Terms</Link>
                <Link className="FooterLink" to="/privacy">Privacy</Link>
            </div>
        </>
    )
}