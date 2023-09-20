import { motion } from "framer-motion";
import { ReactNode } from "react";

const fadeIn = {
    hidden: { opacity: 0, y: 0 },
    visible: { opacity: 1, y: 0 }
}
interface MotionDivProps {
    children: ReactNode;
    variant: string;
    delay: number;
    className?: string;
}

function getVariant(variant: string) {
    switch (variant) {
        case "fadeIn":
            return fadeIn;
        default:
            return fadeIn;
    }
}

export const MotionDiv: React.FC<MotionDivProps> = ({ children, variant, delay, className }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={getVariant(variant)}
        transition={{ duration: 1, delay: delay }}
        className={className}
    >
        {children}
    </motion.div>
);
