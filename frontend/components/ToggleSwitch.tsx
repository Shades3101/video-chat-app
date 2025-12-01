"use client";
import { useState } from "react";

export function ToggleSwitch() {
    const [on, setOn] = useState(true);

    return (
        <div
            onClick={() => setOn(!on)}
            className={`w-10 h-5 flex items-center rounded-full cursor-pointer transition ${on ? "bg-green-500" : "bg-white/20"
                }`}
        >
            <div
                className={`h-4 w-4 bg-white rounded-full transition ${on ? "translate-x-5" : "translate-x-1"
                    }`}
            />
        </div>
    );
}
