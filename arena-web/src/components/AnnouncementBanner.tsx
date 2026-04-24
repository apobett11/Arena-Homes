"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AnnouncementBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative bg-primary py-3 px-4 shadow-2xl"
                >
                    <div className="container mx-auto flex items-center justify-center gap-4 text-center text-[10px] md:text-xs font-bold uppercase tracking-widest text-white">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-white animate-pulse" />
                            <span>New Year Special: Get <span className="bg-white/20 px-2 py-0.5 rounded-full text-white">20% off</span> on your first month booking!</span>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="hover:rotate-90 transition-all p-1 text-white/80 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>

            )}
        </AnimatePresence>
    );
};
