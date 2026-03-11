"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import * as THREE from "three";

type Uniforms = {
    [key: string]: {
        value: number[] | number[][] | number;
        type: string;
    };
};

interface ShaderProps {
    source: string;
    uniforms: {
        [key: string]: {
            value: number[] | number[][] | number;
            type: string;
        };
    };
    maxFps?: number;
}

interface SignInPageProps {
    className?: string;
    mode?: "login" | "signup";
}

export const CanvasRevealEffect = ({
    animationSpeed = 10,
    opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
    colors = [[0, 255, 255]],
    containerClassName,
    dotSize,
    showGradient = true,
    reverse = false, // This controls the direction
}: {
    animationSpeed?: number;
    opacities?: number[];
    colors?: number[][];
    containerClassName?: string;
    dotSize?: number;
    showGradient?: boolean;
    reverse?: boolean; // This prop determines the direction
}) => {
    return (
        <div className={cn("h-full relative w-full", containerClassName)}> {/* Removed bg-white */}
            <div className="h-full w-full">
                <DotMatrix
                    colors={colors ?? [[0, 255, 255]]}
                    dotSize={dotSize ?? 3}
                    opacities={
                        opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
                    }
                    // Pass reverse state and speed via string flags in the empty shader prop
                    shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
                    center={["x", "y"]}
                />
            </div>
            {showGradient && (
                // Adjust gradient colors if needed based on background (was bg-white, now likely uses containerClassName bg)
                // Example assuming a dark background like the SignInPage uses:
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            )}
        </div>
    );
};


interface DotMatrixProps {
    colors?: number[][];
    opacities?: number[];
    totalSize?: number;
    dotSize?: number;
    shader?: string;
    center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
    colors = [[0, 0, 0]],
    opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
    totalSize = 20,
    dotSize = 2,
    shader = "", // This shader string will now contain the animation logic
    center = ["x", "y"],
}) => {
    // ... uniforms calculation remains the same for colors, opacities, etc.
    const uniforms = React.useMemo(() => {
        let colorsArray = [
            colors[0],
            colors[0],
            colors[0],
            colors[0],
            colors[0],
            colors[0],
        ];
        if (colors.length === 2) {
            colorsArray = [
                colors[0],
                colors[0],
                colors[0],
                colors[1],
                colors[1],
                colors[1],
            ];
        } else if (colors.length === 3) {
            colorsArray = [
                colors[0],
                colors[0],
                colors[1],
                colors[1],
                colors[2],
                colors[2],
            ];
        }
        return {
            u_colors: {
                value: colorsArray.map((color) => [
                    color[0] / 255,
                    color[1] / 255,
                    color[2] / 255,
                ]),
                type: "uniform3fv",
            },
            u_opacities: {
                value: opacities,
                type: "uniform1fv",
            },
            u_total_size: {
                value: totalSize,
                type: "uniform1f",
            },
            u_dot_size: {
                value: dotSize,
                type: "uniform1f",
            },
            u_reverse: {
                value: shader.includes("u_reverse_active") ? 1 : 0, // Convert boolean to number (1 or 0)
                type: "uniform1i", // Use 1i for bool in WebGL1/GLSL100, or just bool for GLSL300+ if supported
            },
        };
    }, [colors, opacities, totalSize, dotSize, shader]); // Add shader to dependencies

    return (
        <Shader
            // The main animation logic is now built *outside* the shader prop
            source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse; // Changed from bool to int

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x")
                    ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
                    : ""
                }
            ${center.includes("y")
                    ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
                    : ""
                }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2); // Used for initial opacity random pick and color
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            // --- Animation Timing Logic ---
            float animation_speed_factor = 0.5; // Extract speed from shader string
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            // Calculate timing offset for Intro (from center)
            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

            // Calculate timing offset for Outro (from edges)
            // Max distance from center to a corner of the grid
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);


            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                 // Outro logic: opacity starts high, goes to 0 when time passes offset
                 opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                 // Clamp for fade-out transition
                 opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                 // Intro logic: opacity starts 0, goes to base opacity when time passes offset
                 opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                 // Clamp for fade-in transition
                 opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }


            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a; // Premultiply alpha
        }`}
            uniforms={uniforms}
            maxFps={60}
        />
    );
};


const ShaderMaterial = ({
    source,
    uniforms,
    maxFps = 60,
}: {
    source: string;
    hovered?: boolean;
    maxFps?: number;
    uniforms: Uniforms;
}) => {
    const { size } = useThree();
    const ref = useRef<THREE.Mesh>(null);
    let lastFrameTime = 0;

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const timestamp = clock.getElapsedTime();

        lastFrameTime = timestamp;

        const material: any = ref.current.material;
        const timeLocation = material.uniforms.u_time;
        timeLocation.value = timestamp;
    });

    const getUniforms = () => {
        const preparedUniforms: any = {};

        for (const uniformName in uniforms) {
            const uniform: any = uniforms[uniformName];

            switch (uniform.type) {
                case "uniform1f":
                    preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
                    break;
                case "uniform1i":
                    preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
                    break;
                case "uniform3f":
                    preparedUniforms[uniformName] = {
                        value: new THREE.Vector3().fromArray(uniform.value),
                        type: "3f",
                    };
                    break;
                case "uniform1fv":
                    preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
                    break;
                case "uniform3fv":
                    preparedUniforms[uniformName] = {
                        value: uniform.value.map((v: number[]) =>
                            new THREE.Vector3().fromArray(v)
                        ),
                        type: "3fv",
                    };
                    break;
                case "uniform2f":
                    preparedUniforms[uniformName] = {
                        value: new THREE.Vector2().fromArray(uniform.value),
                        type: "2f",
                    };
                    break;
                default:
                    console.error(`Invalid uniform type for '${uniformName}'.`);
                    break;
            }
        }

        preparedUniforms["u_time"] = { value: 0, type: "1f" };
        preparedUniforms["u_resolution"] = {
            value: new THREE.Vector2(size.width * 2, size.height * 2),
        }; // Initialize u_resolution
        return preparedUniforms;
    };

    // Shader material
    const material = useMemo(() => {
        const materialObject = new THREE.ShaderMaterial({
            vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
            fragmentShader: source,
            uniforms: getUniforms(),
            glslVersion: THREE.GLSL3,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneFactor,
        });

        return materialObject;
    }, [size.width, size.height, source]);

    return (
        <mesh ref={ref as any}>
            <planeGeometry args={[2, 2]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
    return (
        <Canvas className="absolute inset-0  h-full w-full">
            <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
        </Canvas>
    );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const defaultTextColor = 'text-gray-300';
    const hoverTextColor = 'text-white';
    const textSizeClass = 'text-sm';

    return (
        <a href={href} className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass}`}>
            <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
                <span className={defaultTextColor}>{children}</span>
                <span className={hoverTextColor}>{children}</span>
            </div>
        </a>
    );
};

function MiniNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
    const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (shapeTimeoutRef.current) {
            clearTimeout(shapeTimeoutRef.current);
        }

        if (isOpen) {
            setHeaderShapeClass('rounded-xl');
        } else {
            shapeTimeoutRef.current = setTimeout(() => {
                setHeaderShapeClass('rounded-full');
            }, 300);
        }

        return () => {
            if (shapeTimeoutRef.current) {
                clearTimeout(shapeTimeoutRef.current);
            }
        };
    }, [isOpen]);

    const logoElement = (
        <div className="relative w-5 h-5 flex items-center justify-center">
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
        </div>
    );

    const navLinksData: { label: string; href: string }[] = [];

    const loginButtonElement = (
        <Link href="/login" className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200 w-full sm:w-auto text-center">
            LogIn
        </Link>
    );

    const signupButtonElement = (
        <div className="relative group w-full sm:w-auto">
            <div className="absolute inset-0 -m-2 rounded-full
                     hidden sm:block
                     bg-gray-100
                     opacity-40 filter blur-lg pointer-events-none
                     transition-all duration-300 ease-out
                     group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3"></div>
            <Link href="/signup" className="relative z-10 px-4 py-2 sm:px-3 text-xs sm:text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all duration-200 w-full sm:w-auto block text-center">
                Signup
            </Link>
        </div>
    );

    return (
        <header className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-20
                       flex flex-col items-center
                       pl-6 pr-6 py-3 backdrop-blur-sm
                       ${headerShapeClass}
                       border border-[#333] bg-[#1f1f1f57]
                       w-[calc(100%-2rem)] sm:w-auto
                       transition-[border-radius] duration-0 ease-in-out`}>

            <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
                <div className="flex items-center">
                    {logoElement}
                </div>

                <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
                    {navLinksData.map((link) => (
                        <AnimatedNavLink key={link.href} href={link.href}>
                            {link.label}
                        </AnimatedNavLink>
                    ))}
                </nav>

                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                    {loginButtonElement}
                    {signupButtonElement}
                </div>

                <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    )}
                </button>
            </div>

            <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
                <nav className="flex flex-col items-center space-y-4 text-base w-full">
                    {navLinksData.map((link) => (
                        <a key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors w-full text-center">
                            {link.label}
                        </a>
                    ))}
                </nav>
                <div className="flex flex-col items-center space-y-4 mt-4 w-full">
                    {loginButtonElement}
                    {signupButtonElement}
                </div>
            </div>
        </header>
    );
}

export const SignInPage = ({ className, mode = "login" }: SignInPageProps) => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const isSignup = mode === "signup";

    // Mode-specific canvas colors
    const canvasColors: number[][] = isSignup
        ? [[180, 120, 255], [255, 100, 200]]  // Purple/pink for signup
        : [[120, 180, 255], [200, 220, 255]];  // Cool blue for login
    const [step, setStep] = useState<"email" | "password" | "success">("email");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
    const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
    const passwordInputRef = useRef<HTMLInputElement | null>(null);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setStep("password");
        }
    };

    // Focus password input when password screen appears
    useEffect(() => {
        if (step === "password") {
            setTimeout(() => {
                passwordInputRef.current?.focus();
            }, 500);
        }
    }, [step]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setIsLoading(true);
        setError("");

        if (isSignup) {
            try {
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    setError(data.error || "Signup failed");
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                setError("Something went wrong during signup");
                setIsLoading(false);
                return;
            }
        }

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Invalid credentials. Please check your email and password.");
            setIsLoading(false);
        } else {
            // Trigger success animation
            setReverseCanvasVisible(true);
            setTimeout(() => setInitialCanvasVisible(false), 50);
            setTimeout(() => {
                setStep("success");
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleBackClick = () => {
        setStep("email");
        setPassword("");
        setError("");
        setReverseCanvasVisible(false);
        setInitialCanvasVisible(true);
    };

    // ───────────────────────────────────────────
    // Shared form content (used by both layouts)
    // ───────────────────────────────────────────
    const formContent = (
        <AnimatePresence mode="wait">
            {step === "email" ? (
                <motion.div
                    key="email-step"
                    initial={{ opacity: 0, y: isSignup ? 30 : 0, x: isSignup ? 0 : -60 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: isSignup ? -30 : 0, x: isSignup ? 0 : -60 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={isSignup ? "space-y-6 text-center" : "space-y-8 text-left"}
                >
                    <div className={isSignup ? "space-y-2" : "space-y-3"}>
                        {isSignup ? (
                            <>
                                <p className="text-purple-400 text-sm font-medium tracking-widest uppercase">Get Started</p>
                                <h1 className="text-[2.2rem] font-bold leading-[1.1] tracking-tight text-white">Create your account</h1>
                                <p className="text-white/50 text-base">Join thousands of businesses automating outreach</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-[3rem] font-bold leading-[1] tracking-tight text-white">Welcome<br />back.</h1>
                                <p className="text-white/40 text-sm mt-2">Enter your credentials to access your dashboard</p>
                            </>
                        )}
                    </div>

                    <div className={isSignup ? "space-y-4" : "space-y-5"}>
                        <button className={`w-full flex items-center gap-3 text-white border rounded-xl py-3.5 px-5 transition-all duration-200 ${isSignup
                            ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] justify-center backdrop-blur-sm'
                            : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-700/50 justify-start'
                            }`}>
                            <span className={`text-lg font-semibold ${isSignup ? '' : 'w-6 text-center'}`}>G</span>
                            <span className="text-sm">{isSignup ? 'Continue with Google' : 'Google'}</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className={`h-px flex-1 ${isSignup ? 'bg-white/[0.06]' : 'bg-zinc-800'}`} />
                            <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
                            <div className={`h-px flex-1 ${isSignup ? 'bg-white/[0.06]' : 'bg-zinc-800'}`} />
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder={isSignup ? "your@email.com" : "Email address"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full text-white py-3.5 px-5 focus:outline-none transition-all duration-200 ${isSignup
                                        ? 'bg-white/[0.03] border border-white/[0.08] rounded-xl text-center backdrop-blur-sm focus:border-purple-400/40 placeholder:text-white/20'
                                        : 'bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-left focus:border-white/30 placeholder:text-zinc-500'
                                        }`}
                                    required
                                />
                            </div>
                            <motion.button
                                type="submit"
                                className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${isSignup
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                                    : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                Continue →
                            </motion.button>
                        </form>
                    </div>

                    {isSignup ? (
                        <p className="text-xs text-white/25 pt-4 leading-relaxed">
                            By creating an account, you agree to our <Link href="#" className="underline hover:text-white/40 transition-colors">Terms</Link> and <Link href="#" className="underline hover:text-white/40 transition-colors">Privacy Policy</Link>.
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-600 pt-2">
                            Don't have an account? <Link href="/signup" className="text-white/60 hover:text-white transition-colors">Sign up</Link>
                        </p>
                    )}
                </motion.div>
            ) : step === "password" ? (
                <motion.div
                    key="password-step"
                    initial={{ opacity: 0, y: isSignup ? 30 : 0, x: isSignup ? 0 : 60 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: isSignup ? -30 : 0, x: isSignup ? 0 : 60 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={isSignup ? "space-y-6 text-center" : "space-y-6 text-left"}
                >
                    <div className={isSignup ? "space-y-2" : "space-y-3"}>
                        {isSignup ? (
                            <>
                                <h1 className="text-[2.2rem] font-bold leading-[1.1] tracking-tight text-white">Set a password</h1>
                                <p className="text-white/40 text-sm">{email}</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-[2.5rem] font-bold leading-[1] tracking-tight text-white">Password</h1>
                                <p className="text-zinc-500 text-sm">{email}</p>
                            </>
                        )}
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input
                            ref={passwordInputRef}
                            type="password"
                            placeholder={isSignup ? "Create a strong password" : "Enter password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full text-white py-3.5 px-5 focus:outline-none transition-all duration-200 ${isSignup
                                ? 'bg-white/[0.03] border border-white/[0.08] rounded-xl text-center backdrop-blur-sm focus:border-purple-400/40 placeholder:text-white/20'
                                : 'bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-left focus:border-white/30 placeholder:text-zinc-500'
                                }`}
                            required
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="flex w-full gap-3">
                            <motion.button
                                type="button"
                                onClick={handleBackClick}
                                className={`rounded-xl font-medium px-6 py-3.5 transition-colors w-[30%] text-sm ${isSignup ? 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1] border border-white/[0.08]' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Back
                            </motion.button>
                            <motion.button
                                type="submit"
                                className={`flex-1 rounded-xl font-medium py-3.5 text-sm transition-all duration-300 ${password
                                    ? isSignup
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 cursor-pointer"
                                        : "bg-white text-black hover:bg-zinc-200 cursor-pointer"
                                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                    }`}
                                disabled={!password || isLoading}
                                whileHover={password ? { scale: 1.02 } : {}}
                                whileTap={password ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Create Account" : "Sign In")}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <motion.div
                    key="success-step"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                    className="space-y-6 text-center"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                        className="py-6"
                    >
                        <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center ${isSignup ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isSignup ? 'text-white' : 'text-black'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </motion.div>

                    <div className="space-y-1">
                        <h1 className={`font-bold leading-[1.1] tracking-tight text-white ${isSignup ? 'text-[2.2rem]' : 'text-[2.5rem]'}`}>
                            {isSignup ? "You're all set!" : "You're in."}
                        </h1>
                        <p className="text-white/40 text-sm">{isSignup ? "Let's set up your workspace" : "Redirecting to your dashboard"}</p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => router.push(isSignup ? "/onboarding" : "/dashboard")}
                        className={`w-full rounded-xl font-medium py-3.5 text-sm transition-all cursor-pointer ${isSignup
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            : 'bg-white text-black hover:bg-zinc-200'
                            }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        {isSignup ? "Start Onboarding →" : "Go to Dashboard →"}
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // ───────────────────────────────────────────
    // LOGIN LAYOUT: Split-screen
    // ───────────────────────────────────────────
    if (!isSignup) {
        return (
            <div className={cn("flex w-full min-h-screen bg-black relative", className)}>
                <MiniNavbar />

                {/* Left panel: solid dark with form */}
                <div className="relative z-10 w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-center px-10 lg:px-16 py-20 lg:py-0 min-h-screen bg-black border-r border-zinc-800/50">
                    {/* Subtle top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                    <div className="w-full max-w-[360px]">
                        {/* Logo / Brand mark */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                                    <span className="text-black font-bold text-sm">W</span>
                                </div>
                                <span className="text-white/80 text-sm font-medium">Work-Flow</span>
                            </div>
                        </div>

                        {formContent}
                    </div>
                </div>

                {/* Right panel: canvas animation */}
                <div className="hidden lg:flex flex-1 relative overflow-hidden">
                    {initialCanvasVisible && (
                        <div className="absolute inset-0">
                            <CanvasRevealEffect
                                animationSpeed={3}
                                containerClassName="bg-black"
                                colors={canvasColors}
                                dotSize={6}
                                reverse={false}
                            />
                        </div>
                    )}
                    {reverseCanvasVisible && (
                        <div className="absolute inset-0">
                            <CanvasRevealEffect
                                animationSpeed={4}
                                containerClassName="bg-black"
                                colors={canvasColors}
                                dotSize={6}
                                reverse={true}
                            />
                        </div>
                    )}
                    {/* Radial fade from the left edge for seamless blending */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent w-1/3" />
                    {/* Center text overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-3 px-12">
                            <p className="text-white/10 text-[8rem] font-bold leading-none tracking-tighter select-none">AI</p>
                        </div>
                    </div>
                </div>

                {/* Mobile: canvas behind the form */}
                <div className="lg:hidden absolute inset-0 z-0 opacity-30">
                    {initialCanvasVisible && (
                        <CanvasRevealEffect
                            animationSpeed={3}
                            containerClassName="bg-black"
                            colors={canvasColors}
                            dotSize={6}
                            reverse={false}
                        />
                    )}
                </div>
            </div>
        );
    }

    // ───────────────────────────────────────────
    // SIGNUP LAYOUT: Centered glass card
    // ───────────────────────────────────────────
    return (
        <div className={cn("flex w-full flex-col min-h-screen bg-black relative items-center justify-center", className)}>
            {/* Full-screen canvas background */}
            <div className="absolute inset-0 z-0">
                {initialCanvasVisible && (
                    <div className="absolute inset-0">
                        <CanvasRevealEffect
                            animationSpeed={4}
                            containerClassName="bg-black"
                            colors={canvasColors}
                            dotSize={4}
                            reverse={false}
                        />
                    </div>
                )}
                {reverseCanvasVisible && (
                    <div className="absolute inset-0">
                        <CanvasRevealEffect
                            animationSpeed={4}
                            containerClassName="bg-black"
                            colors={canvasColors}
                            dotSize={4}
                            reverse={true}
                        />
                    </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
            </div>

            <MiniNavbar />

            {/* Floating glass card */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="relative z-10 w-full max-w-md mx-4 mt-24"
            >
                {/* Glow effect behind the card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-60" />

                {/* Card */}
                <div className="relative bg-black/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 sm:p-10">
                    {/* Top decorative line */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />

                    {formContent}

                    {/* Bottom text */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-zinc-600">
                            Already have an account? <Link href="/login" className="text-purple-400/80 hover:text-purple-300 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
