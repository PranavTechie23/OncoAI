import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { useInView } from "react-intersection-observer";

interface ScrollAnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale" | "blur" | "rotate";
  className?: string;
  once?: boolean;
  amount?: number;
  distance?: number;
  springiness?: "none" | "low" | "medium" | "high";
}

export function ScrollAnimation({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  className = "",
  once = true,
  amount = 0.2,
  distance = 50,
  springiness = "medium",
}: ScrollAnimationProps) {
  const { ref, inView } = useInView({
    triggerOnce: once,
    threshold: amount,
  });
  
  const shouldReduceMotion = useReducedMotion();

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { y: distance, opacity: 0 };
      case "down":
        return { y: -distance, opacity: 0 };
      case "left":
        return { x: distance, opacity: 0 };
      case "right":
        return { x: -distance, opacity: 0 };
      case "scale":
        return { scale: 0.8, opacity: 0 };
      case "blur":
        return { filter: "blur(10px)", opacity: 0 };
      case "rotate":
        return { rotate: -10, scale: 0.9, opacity: 0 };
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    if (direction === "scale") {
      return { scale: 1, opacity: 1 };
    }
    if (direction === "blur") {
      return { filter: "blur(0px)", opacity: 1 };
    }
    if (direction === "rotate") {
      return { rotate: 0, scale: 1, opacity: 1 };
    }
    return { x: 0, y: 0, opacity: 1 };
  };

  const getTransition = () => {
    const springConfigs = {
      none: { type: "tween" as const, duration, delay, ease: "easeOut" as const },
      low: { type: "spring" as const, stiffness: 50, damping: 20, delay },
      medium: { type: "spring" as const, stiffness: 100, damping: 20, delay },
      high: { type: "spring" as const, stiffness: 200, damping: 25, delay },
    };
    return springConfigs[springiness];
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={inView ? getAnimate() : getInitial()}
      transition={getTransition()}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  amount?: number;
  duration?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
  once = true,
  amount = 0.1,
  duration = 0.5,
}: StaggerContainerProps) {
  const { ref, inView } = useInView({
    triggerOnce: once,
    threshold: amount,
  });

  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale";
  distance?: number;
}

export function StaggerItem({
  children,
  className = "",
  direction = "up",
  distance = 30,
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  const getVariants = () => {
    const base = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    switch (direction) {
      case "up":
        return {
          hidden: { ...base.hidden, y: distance },
          visible: { ...base.visible, y: 0 },
        };
      case "down":
        return {
          hidden: { ...base.hidden, y: -distance },
          visible: { ...base.visible, y: 0 },
        };
      case "left":
        return {
          hidden: { ...base.hidden, x: distance },
          visible: { ...base.visible, x: 0 },
        };
      case "right":
        return {
          hidden: { ...base.hidden, x: -distance },
          visible: { ...base.visible, x: 0 },
        };
      case "scale":
        return {
          hidden: { ...base.hidden, scale: 0.8 },
          visible: { ...base.visible, scale: 1 },
        };
      default:
        return base;
    }
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={getVariants()}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Demo component to showcase the animations
export default function ScrollAnimationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-32">
        {/* Hero Section */}
        <ScrollAnimation direction="fade" duration={1}>
          <h1 className="text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Enhanced Scroll Animations
          </h1>
        </ScrollAnimation>

        {/* Direction Examples */}
        <section className="space-y-16">
          <ScrollAnimation direction="up" distance={80}>
            <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Slide Up Animation</h2>
              <p className="text-purple-200">Elements gracefully rise from below with smooth easing.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="left" distance={100}>
            <div className="bg-pink-500/20 backdrop-blur-sm border border-pink-500/30 p-8 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4">Slide Left Animation</h2>
              <p className="text-pink-200">Content flows in from the right side of the screen.</p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation direction="scale" springiness="high">
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