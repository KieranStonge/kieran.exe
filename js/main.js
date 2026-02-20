(function () {
  const phrases = [
    "Booting engineer profile...",
    "Loading cloud automation modules...",
    "Initializing CI/CD defense systems...",
    "Status: READY FOR DEPLOYMENT"
  ];

  const typewriter = document.getElementById("typewriter");
  let p = 0;
  let c = 0;

  function tickType() {
    if (!typewriter) return;
    const current = phrases[p];
    typewriter.textContent = current.slice(0, c++);

    if (c <= current.length) {
      setTimeout(tickType, 32);
      return;
    }

    setTimeout(() => {
      c = 0;
      p = (p + 1) % phrases.length;
      tickType();
    }, 1250);
  }

  function setupReveal() {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    nodes.forEach((node) => observer.observe(node));
  }

  function setupTilt() {
    const card = document.querySelector(".tilt-card");
    if (!card) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 8;
      const ry = (x - 0.5) * 8;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0) rotateY(0)";
    });
  }

  function setupBackgroundParticles() {
    const canvas = document.getElementById("bg-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = [];
    const count = 80;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawn() {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 1.8 + 0.6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 240, 255, 0.85)";

      for (const part of particles) {
        part.x += part.vx;
        part.y += part.vy;

        if (part.x < 0 || part.x > canvas.width) part.vx *= -1;
        if (part.y < 0 || part.y > canvas.height) part.vy *= -1;

        ctx.beginPath();
        ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    resize();
    spawn();
    draw();
    window.addEventListener("resize", () => {
      resize();
      spawn();
    });
  }

  function setupResumeDownloads() {
    const resumeLink = document.getElementById("resume-link");
    if (!resumeLink) return;

    resumeLink.addEventListener("click", () => {
      // Trigger a second download for the cover letter when resume is clicked.
      setTimeout(() => {
        const cover = document.createElement("a");
        cover.href = "assets/cover-letter.pdf";
        cover.download = "KIERAN-ST-ONGE-Cover-Letter.pdf";
        cover.style.display = "none";
        document.body.appendChild(cover);
        cover.click();
        cover.remove();
      }, 80);
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  tickType();
  setupReveal();
  setupTilt();
  setupBackgroundParticles();
  setupResumeDownloads();
})();
