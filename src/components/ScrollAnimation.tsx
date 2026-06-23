import { ReactNode, createContext, useContext } from "react";
import { useInView } from "react-intersection-observer";

interface ScrollAnimationProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale" | "blur" | "rotate";
  className?: string;
  once?: boolean;
  amount?: number;
  duration?: number;
  springiness?: "low" | "medium" | "high";
}

export function ScrollAnimation({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true,
  amount = 0.2,
  duration = 1,
}: ScrollAnimationProps) {
  const { ref, inView } = useInView({
    triggerOnce: once,
    threshold: amount,
  });

  let translateClass = "";
  let scaleClass = "";
  let blurClass = "";
  let rotateClass = "";

  if (!inView) {
    if (direction === "up") translateClass = "translate-y-12";
    if (direction === "down") translateClass = "-translate-y-12";
    if (direction === "left") translateClass = "-translate-x-12";
    if (direction === "right") translateClass = "translate-x-12";
    if (direction === "scale") scaleClass = "scale-90";
    if (direction === "blur") blurClass = "blur-md";
    if (direction === "rotate") {
      rotateClass = "-rotate-12";
      scaleClass = "scale-90";
    }
  } else {
    translateClass = "translate-y-0 translate-x-0";
    scaleClass = "scale-100";
    blurClass = "blur-0";
    rotateClass = "rotate-0";
  }

  return (
    <div
      ref={ref}
      className={`${className} transition-all ease-out ${inView ? "opacity-100" : "opacity-0"} ${translateClass} ${scaleClass} ${blurClass} ${rotateClass}`}
      style={{ 
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s` 
      }}
    >
      {children}
    </div>
  );
}

interface StaggerContextType {
  inView: boolean;
  staggerDelay: number;
}

const StaggerContext = createContext<StaggerContextType | null>(null);

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className = "", staggerDelay = 0.15 }: StaggerContainerProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={className}>
      <StaggerContext.Provider value={{ inView, staggerDelay }}>
        {children}
      </StaggerContext.Provider>
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale" | "blur" | "rotate";
}

export function StaggerItem({ children, className = "", index = 0, direction = "up" }: StaggerItemProps) {
  const context = useContext(StaggerContext);
  
  // If used without a StaggerContainer, default to inView = true to avoid hiding forever
  const inViewParent = context ? context.inView : true;
  const staggerDelay = context ? context.staggerDelay : 0.15;
  
  const delay = index * staggerDelay;

  let translateClass = "";
  let scaleClass = "";
  let blurClass = "";
  let rotateClass = "";

  if (!inViewParent) {
    if (direction === "up") translateClass = "translate-y-12";
    if (direction === "down") translateClass = "-translate-y-12";
    if (direction === "left") translateClass = "-translate-x-12";
    if (direction === "right") translateClass = "translate-x-12";
    if (direction === "scale") scaleClass = "scale-90";
    if (direction === "blur") blurClass = "blur-md";
    if (direction === "rotate") {
      rotateClass = "-rotate-12";
      scaleClass = "scale-90";
    }
  } else {
    translateClass = "translate-y-0 translate-x-0";
    scaleClass = "scale-100";
    blurClass = "blur-0";
    rotateClass = "rotate-0";
  }
  
  return (
    <div
      className={`${className} transition-all duration-700 ease-out ${inViewParent ? "opacity-100" : "opacity-0"} ${translateClass} ${scaleClass} ${blurClass} ${rotateClass}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export default function ScrollAnimationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-32">
        {/* Hero Section */}
        <ScrollAnimation>
          <h1 className="text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Enhanced Scroll Animations
          </h1>
        </ScrollAnimation>

        {/* Direction Examples */}
        <section className="space-y-16">
          <ScrollAnimation>
            <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Slide Up Animation</h2>
              <p className="text-purple-200">Elements gracefully rise from below with smooth easing.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="bg-pink-500/20 backdrop-blur-sm border border-pink-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Slide Left Animation</h2>
              <p className="text-pink-200">Content flows in from the right side of the screen.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Scale Animation</h2>
              <p className="text-blue-200">Elements pop into view with a bouncy spring effect.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="blur" duration={0.8}>
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Blur Fade Animation</h2>
              <p className="text-green-200">Content comes into focus as it appears.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="rotate" springiness="medium">
            <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Rotate Animation</h2>
              <p className="text-yellow-200">Elements rotate and scale into place.</p>
            </div>
          </ScrollAnimation>
        </section>

        {/* Stagger Animation */}
        <section className="space-y-8">
          <ScrollAnimation direction="fade">
            <h2 className="text-4xl font-bold text-center mb-12">Staggered Grid</h2>
          </ScrollAnimation>
          
          <StaggerContainer staggerDelay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <StaggerItem key={item} direction="scale">
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/30 p-6 rounded-xl hover:scale-105 transition-transform cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Feature {item}</h3>
                  <p className="text-gray-300 text-sm">Each card animates in sequence with perfect timing.</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Multiple Delays */}
        <section className="space-y-8">
          <ScrollAnimation direction="up">
            <h2 className="text-4xl font-bold text-center mb-12">Orchestrated Timing</h2>
          </ScrollAnimation>
          
          <div className="space-y-6">
            <ScrollAnimation direction="right" delay={0}>
              <div className="bg-indigo-500/20 border-l-4 border-indigo-400 p-6 rounded-r-xl">
                <p className="text-lg">First element appears immediately</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation direction="right" delay={0.2}>
              <div className="bg-indigo-500/20 border-l-4 border-indigo-400 p-6 rounded-r-xl">
                <p className="text-lg">Second element with 0.2s delay</p>
              </div>
            </ScrollAnimation>
            <ScrollAnimation direction="right" delay={0.4}>
              <div className="bg-indigo-500/20 border-l-4 border-indigo-400 p-6 rounded-r-xl">
                <p className="text-lg">Third element with 0.4s delay</p>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Footer */}
        <ScrollAnimation direction="fade" delay={0.3}>
          <div className="text-center py-12 border-t border-purple-500/30">
            <p className="text-gray-400">Scroll back up to see the animations again (once=false)</p>
          </div>
        </ScrollAnimation>
      </div>
    </div>
  );
}