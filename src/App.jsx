import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import './App.css';
import { translations } from './translations';

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [wpDropdownOpen, setWpDropdownOpen] = useState(false);
  const [p4idx, setP4idx] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const canvasRef = useRef(null);
  const typewriterRef = useRef(null);

  const t = translations[lang];

  useEffect(() => {
    // Three.js scene
    if (canvasRef.current) {
      const container = canvasRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050D1A);
      const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 12;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      const vertexShader = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vPosition;
        void main() { vUv = uv; vNormal = normalize(normalMatrix * normal); vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

      const fragmentShader = `uniform vec3 colorPaper,colorRust,colorForest,colorInk; uniform float time;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vPosition;
        vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
        vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
        void main(){vec3 lightDir=normalize(vec3(1.,1.,1.));float li=dot(vNormal,lightDir);vec3 pos=vPosition;float angle=time*0.1;mat3 rotY=mat3(cos(angle),0.,sin(angle),0.,1.,0.,-sin(angle),0.,cos(angle));float nv=snoise(rotY*pos*2.5);vec3 fc=colorPaper;if(nv>0.05){fc=colorForest;if(li<0.1)fc=colorRust;}else{if(li<-0.2)fc=mix(colorPaper,colorInk,0.2);}float vd=dot(normalize(vNormal),vec3(0,0,1));if(vd<0.2&&vd>0.){if(mod(gl_FragCoord.x+gl_FragCoord.y,6.)<2.)fc=colorForest;}gl_FragColor=vec4(fc,1.);}`;

      const uniforms = {
        time: { value: 0 },
        colorPaper: { value: new THREE.Color('#050D1A') },
        colorRust: { value: new THREE.Color('#FFBE37') },
        colorForest: { value: new THREE.Color('#205AEE') },
        colorInk: { value: new THREE.Color('#5AB53E') }
      };
      const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5, 30), new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms }));
      scene.add(sphere);

      let mx = 0, my = 0;
      document.addEventListener('mousemove', e => {
        mx = (e.clientX - window.innerWidth / 2) * 0.001;
        my = (e.clientY - window.innerHeight / 2) * 0.001;
      });

      const animate = () => {
        requestAnimationFrame(animate);
        uniforms.time.value += 0.005;
        sphere.rotation.y += 0.002;
        sphere.rotation.y += (mx - sphere.rotation.y) * 0.05;
        sphere.rotation.x += (my - sphere.rotation.x) * 0.05;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    const texts = translations[lang]['p3.typewriter'];
    let ti = 0, ci = 0;

    const type = () => {
      const txt = texts[ti];
      if (ci < txt.length) {
        setTypewriterText(txt.substring(0, ci + 1));
        ci++;
        typewriterRef.current = setTimeout(type, 80 + Math.random() * 50);
      } else {
        typewriterRef.current = setTimeout(() => {
          setTypewriterText('');
          ci = 0;
          ti = (ti + 1) % texts.length;
          type();
        }, 2000);
      }
    };

    typewriterRef.current = setTimeout(type, 1500);
    return () => clearTimeout(typewriterRef.current);
  }, [lang]);

  // P4 carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setP4idx(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleComingSoon = (e) => {
    e.preventDefault();
    setModalActive(true);
    setTimeout(() => setModalActive(false), 1000);
  };

  const p4update = (idx) => {
    setP4idx(idx);
  };

  const phoneImgs = ['/images/tp1.png', '/images/tp2.png', '/images/tp3.png', '/images/tp1.png'];

  return (
    <>
      <div id="canvas-container" ref={canvasRef}></div>

      {/* Navigation */}
      <nav className="top-nav">
        <a href="#hero" className="top-nav-logo">
          <img src="/images/logo.png" alt="META ASSETS" />
          <span>META ASSETS</span>
        </a>
        <div className={`menu-overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)}></div>
        <div className={`top-nav-links ${menuOpen ? 'open' : ''}`} id="nav-links">
          <a href="#hero" className="top-nav-link">{t['nav.home']}</a>
          <a href="#page-two" className="top-nav-link">{t['nav.tech']}</a>
          <a href="#page-three" className="top-nav-link">{t['nav.products']}</a>
          <a href="#page-four" className="top-nav-link">{t['nav.dapp']}</a>
          <a href="#page-five" className="top-nav-link">{t['nav.ecosystem']}</a>
          <div className={`nav-dropdown ${wpDropdownOpen ? 'open' : ''}`}>
            <a href="#" className="top-nav-link nav-dropdown-trigger" onClick={(e) => { if (window.innerWidth <= 1024) { e.preventDefault(); setWpDropdownOpen(!wpDropdownOpen); } }}>
              {t['nav.whitepaper']} <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </a>
            <div className="nav-dropdown-menu">
              <Link to="/whitepaper-technical" className="nav-dropdown-item" onClick={() => { setMenuOpen(false); setWpDropdownOpen(false); }}>{t['nav.wp_technical']}</Link>
            </div>
          </div>
          <a href="https://ma-chain.xyz/" className="top-nav-link" target="_blank" rel="noopener noreferrer">{t['nav.explorer']}</a>
          <a href="#" className="top-nav-link top-nav-link-accent" onClick={handleComingSoon}>{t['nav.clawmask']}</a>
          <a href="#" className="top-nav-link" onClick={handleComingSoon}>{t['nav.miningpool']}</a>
          <button className="lang-switch lang-switch-mobile" onClick={toggleLang}>{lang === 'en' ? '中文' : 'EN'}</button>
          <a href="#" className="top-nav-wallet-mobile" onClick={handleComingSoon}>{t['nav.wallet']}</a>
        </div>
        <button className="lang-switch" onClick={toggleLang}>{lang === 'en' ? '中文' : 'EN'}</button>
        <button className="top-nav-wallet" onClick={handleComingSoon}>{t['nav.wallet']}</button>
        <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* Page 1: Hero */}
      <div className="ui-layer" id="hero">
        <header>
          <div className="brand-pill">
            <div className="status-dot"></div>
            <span>{t['hero.tagline']}</span>
          </div>
        </header>
        <main>
          <div className="data-block data-tl">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.2 }}>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.nodes']}</span>50K+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.tps']}</span>10M+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.users']}</span>1M+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.tvl']}</span>$2.5B</li>
            </ul>
          </div>
          <div className="hero-title-wrapper">
            <h1>MAC</h1>
            <div className="star-graphic">
              <svg viewBox="0 0 40 40"><path d="M20 0 L23 17 L40 20 L23 23 L20 40 L17 23 L0 20 L17 17 Z"></path></svg>
            </div>
          </div>
          <div className="subtitle-pill-cluster">
            <a href="https://ma-chain.xyz/" className="pill" target="_blank" rel="noopener noreferrer">{t['hero.pill1']}</a>
            <a href="#" className="pill accent" onClick={handleComingSoon}>{t['hero.pill2']}</a>
            <a href="#" className="pill" onClick={handleComingSoon}>{t['hero.pill3']}</a>
            <a href="#" className="pill" onClick={handleComingSoon}>{t['hero.pill4']}</a>
          </div>
          <div className="data-block data-tr">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.2 }}>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.nodes']}</span>50K+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.tps']}</span>10M+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.users']}</span>1M+</li>
              <li><span style={{ color: 'var(--terra-green)' }}>{t['stats.tvl']}</span>$2.5B</li>
            </ul>
          </div>
        </main>
        <div className="stats-subtitle-wrapper">
          <div className="stats-subtitle-graphic">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="#00E5C4" filter="drop-shadow(0 0 10px rgba(0,229,196,0.6))" /></svg>
          </div>
          <span>{t['hero.subtitle']}</span>
        </div>
        <div className="grunge-map">
          <div className="footer-content">
            <div className="value-panel">
              <div className="value-item">
                <div className="value-mono">01</div>
                <div>
                  <div className="value-number">5 Y</div>
                  <div className="value-title">{t['stats.halving']}</div>
                  <div className="value-desc">{t['stats.halvingDesc']}</div>
                </div>
              </div>
              <div className="value-item">
                <div className="value-mono">02</div>
                <div>
                  <div className="value-number">3.1 B</div>
                  <div className="value-title">{t['stats.supply']}</div>
                  <div className="value-desc">{t['stats.supplyDesc']}</div>
                </div>
              </div>
            </div>
            <div className="coordinate-circle" onClick={() => document.getElementById('page-two').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7"></path>
              </svg>
            </div>
            <div className="value-panel">
              <div className="value-item">
                <div className="value-mono">03</div>
                <div>
                  <div className="value-number">120 D</div>
                  <div className="value-title">{t['stats.unlock']}</div>
                  <div className="value-desc">{t['stats.unlockDesc']}</div>
                </div>
              </div>
              <div className="value-item">
                <div className="value-mono">04</div>
                <div>
                  <div className="value-number">0 Gas</div>
                  <div className="value-title">{t['stats.gas']}</div>
                  <div className="value-desc">{t['stats.gasDesc']}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Comparison */}
      <section className="page-two" id="page-two">
        <div className="page-two-header">
          <h2>{t['p2.title']}</h2>
          <p>{t['p2.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <table className="compare-table">
          <thead>
            <tr>
              <th>{t['p2.col0']}</th>
              <th className="highlight-col">Meta Assets</th>
              <th>Render Network</th>
              <th>Akash Network</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t['p2.r1c0']}</td>
              <td className="mac-col">{t['p2.r1c1']}</td>
              <td>{t['p2.r1c2']}</td>
              <td>{t['p2.r1c3']}</td>
            </tr>
            <tr>
              <td>{t['p2.r2c0']}</td>
              <td className="mac-col">{t['p2.r2c1']}</td>
              <td>{t['p2.r2c2']}</td>
              <td>{t['p2.r2c3']}</td>
            </tr>
            <tr>
              <td>{t['p2.r3c0']}</td>
              <td className="mac-col">{t['p2.r3c1']}</td>
              <td>{t['p2.r3c2']}</td>
              <td>{t['p2.r3c3']}</td>
            </tr>
            <tr>
              <td>{t['p2.r4c0']}</td>
              <td className="mac-col">{t['p2.r4c1']}</td>
              <td>{t['p2.r4c2']}</td>
              <td>{t['p2.r4c3']}</td>
            </tr>
            <tr>
              <td>{t['p2.r5c0']}</td>
              <td className="mac-col">{t['p2.r5c1']}</td>
              <td>{t['p2.r5c2']}</td>
              <td>{t['p2.r5c3']}</td>
            </tr>
            <tr>
              <td>{t['p2.r6c0']}</td>
              <td className="mac-col">{t['p2.r6c1']}</td>
              <td>{t['p2.r6c2']}</td>
              <td>{t['p2.r6c3']}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Page: WEB4.0 Core Spirit */}
      <section className="page-spirit" id="page-spirit">
        <div className="ps-header">
          <h2>{t['ps.title']}</h2>
          <p>{t['ps.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="ps-grid">
          <div className="ps-card">
            <div className="ps-card-num">01</div>
            <h3>{t['ps.c1title']}</h3>
            <p>{t['ps.c1desc']}</p>
          </div>
          <div className="ps-card">
            <div className="ps-card-num">02</div>
            <h3>{t['ps.c2title']}</h3>
            <p>{t['ps.c2desc']}</p>
          </div>
          <div className="ps-card">
            <div className="ps-card-num">03</div>
            <h3>{t['ps.c3title']}</h3>
            <p>{t['ps.c3desc']}</p>
          </div>
          <div className="ps-card">
            <div className="ps-card-num">04</div>
            <h3>{t['ps.c4title']}</h3>
            <p>{t['ps.c4desc']}</p>
          </div>
        </div>
      </section>

      {/* Page: Tech Architecture */}
      <section className="page-arch" id="page-arch">
        <div className="pa-header">
          <h2>{t['pa.title']}</h2>
          <p>{t['pa.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pa-section-label">{t['pa.layerLabel']}</div>
        <div className="pa-layers">
          <div className="pa-layer">
            <div className="pa-layer-num">01</div>
            <h3>{t['pa.l1title']}</h3>
            <p>{t['pa.l1desc']}</p>
          </div>
          <div className="pa-layer">
            <div className="pa-layer-num">02</div>
            <h3>{t['pa.l2title']}</h3>
            <p>{t['pa.l2desc']}</p>
          </div>
          <div className="pa-layer">
            <div className="pa-layer-num">03</div>
            <h3>{t['pa.l3title']}</h3>
            <p>{t['pa.l3desc']}</p>
          </div>
        </div>
        <div className="pa-section-label">{t['pa.featLabel']}</div>
        <div className="pa-features">
          <div className="pa-feat">
            <h3>{t['pa.f1title']}</h3>
            <p>{t['pa.f1desc']}</p>
          </div>
          <div className="pa-feat">
            <h3>{t['pa.f2title']}</h3>
            <p>{t['pa.f2desc']}</p>
          </div>
          <div className="pa-feat">
            <h3>{t['pa.f3title']}</h3>
            <p>{t['pa.f3desc']}</p>
          </div>
        </div>
      </section>

      {/* Page 3: ClawMask */}
      <section className="page-three" id="page-three">
        <div className="p3-container">
          <div className="p3-product-col">
            <div className="p3-scene">
              <div className="p3-computer">
                <div className="p3-face p3-front">
                  <div className="p3-screen-inset">
                    <div className="p3-crt">
                      <div className="p3-crt-glow">
                        <div className="p3-cli-header"><span>ClawMask V2.2</span><span>MEM: 512K OK</span></div>
                        <div className="p3-typing"><span style={{ color: '#888' }}>&gt;_</span> {typewriterText}<span className="p3-cursor"></span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p3-grill">
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                    <div className="p3-vent"></div>
                  </div>
                  <div className="p3-floppy"></div>
                  <div className="p3-sticker">ClawMask V2.2</div>
                  <div className="p3-logo-badge"></div>
                </div>
                <div className="p3-face p3-back"></div>
                <div className="p3-face p3-left"></div>
                <div className="p3-face p3-right"></div>
                <div className="p3-face p3-top"></div>
                <div className="p3-face p3-bottom"></div>
              </div>
            </div>
          </div>
          <div className="p3-content-col">
            <div className="p3-badge">{t['p3.badge']}</div>
            <div className="p3-title">{t['p3.title']}</div>
            <p className="p3-lead">{t['p3.lead']}</p>
            <div className="p3-cta-group">
              <a href="#" className="p3-btn" onClick={handleComingSoon}>{t['p3.btn']}</a>
              <div className="p3-price"><span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: 8 }}>$600</span>{t['p3.free']}</div>
            </div>
            <div className="p3-terminal">
              <div className="p3-term-header">
                <span>ClawMask V2.2</span>
                <div className="p3-term-dots">
                  <div className="p3-term-dot"></div>
                  <div className="p3-term-dot"></div>
                  <div className="p3-term-dot"></div>
                </div>
              </div>
              <div className="p3-term-body">
                <div><span className="p3-label">{t['p3.f1label']}</span> <span className="p3-val">{t['p3.f1val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f2label']}</span> <span className="p3-val">{t['p3.f2val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f3label']}</span> <span className="p3-val">{t['p3.f3val']}</span></div>
                <div style={{ marginTop: 8 }}><span className="p3-label">{t['p3.f4label']}</span> <span className="p3-val">{t['p3.f4val']}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page 4: DApp */}
      <section className="page-four" id="page-four">
        <div className="p4-header">
          <h2>{t['p4.title']}</h2>
          <p>{t['p4.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="p4-container">
          <div className="p4-gallery">
            <div className="p4-gallery-stage">
              <div className={`p4-phone ${p4idx === 0 ? 'p4-phone-left' : p4idx === 1 ? 'p4-phone-center' : p4-phone-right}`} data-p4="0">
                <div className="p4-phone-frame"><img src={phoneImgs[0]} alt="" /></div>
              </div>
              <div className={`p4-phone ${p4idx === 0 ? 'p4-phone-center' : p4idx === 1 ? 'p4-phone-right' : p4idx === 2 ? 'p4-phone-left' : 'p4-phone-center'}`} data-p4="1">
                <div className="p4-phone-frame"><img src={phoneImgs[1]} alt="" /></div>
              </div>
              <div className={`p4-phone ${p4idx === 1 ? 'p4-phone-left' : p4idx === 2 ? 'p4-phone-center' : 'p4-phone-right'}`} data-p4="2">
                <div className="p4-phone-frame"><img src={phoneImgs[2]} alt="" /></div>
              </div>
            </div>
            <div className="p4-gallery-controls">
              <button className="p4-gbtn" onClick={() => p4update((p4idx - 1 + 4) % 4)}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="p4-dots">
                {[0, 1, 2, 3].map(i => (
                  <span key={i} className={`p4-dot ${p4idx === i ? 'active' : ''}`} onClick={() => p4update(i)}></span>
                ))}
              </div>
              <button className="p4-gbtn" onClick={() => p4update((p4idx + 1) % 4)}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
          <div className="p4-right">
            <div className="p4-radar-wrap">
              <div className="p4-radar-bg"></div>
              <div className="p4-arc"></div>
              <div className="p4-arc-sharp"></div>
              <div className="p4-ring p4-ring-1"></div>
              <div className="p4-ring p4-ring-2"></div>
              <div className="p4-ring p4-ring-3"></div>
              <div className="p4-scanner"></div>
              <div className={`p4-hud p4-hud-top ${p4idx === 0 ? 'active' : ''}`}>{t['p4.hud0']}</div>
              <div className={`p4-hud p4-hud-right ${p4idx === 1 ? 'active' : ''}`}>{t['p4.hud1']}</div>
              <div className={`p4-hud p4-hud-bottom ${p4idx === 2 ? 'active' : ''}`}>{t['p4.hud2']}</div>
              <div className={`p4-hud p4-hud-left ${p4idx === 3 ? 'active' : ''}`}>{t['p4.hud3']}</div>
              <div className="p4-card">
                <div className="p4-card-title">{t[`p4.slide${p4idx}title`]}</div>
                <div className="p4-card-desc">{t[`p4.slide${p4idx}desc`]}</div>
                <button className="p4-download-btn" onClick={handleComingSoon}>{t['p4.dlbtn']}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page: Events */}
      <section className="page-events" id="page-events">
        <div className="pe-header">
          <h2>{t['pe.title']}</h2>
          <p>{t['pe.subtitle']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pe-grid">
          <div className="pe-card">
            <h3>{t['pe.c1title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c1time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c1users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c1btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c2title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c2time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c2users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c2btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c3title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c3time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c3users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c3btn']}</a>
          </div>
          <div className="pe-card">
            <h3>{t['pe.c4title']}</h3>
            <div className="pe-meta">
              <div className="pe-meta-item countdown">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>{t['pe.c4time']}</span>
              </div>
              <div className="pe-meta-item">
                <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3 2-5 4-5s4 2 4 5M6 14c0-3 2-5 4-5s4 2 4 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                <span>{t['pe.c4users']}</span>
              </div>
            </div>
            <a href="#" className="pe-btn" onClick={handleComingSoon}>{t['pe.c4btn']}</a>
          </div>
        </div>
      </section>

      {/* Page: Partners */}
      <section className="page-partners" id="page-partners">
        <div className="pp-header">
          <h2>{t['pp.title']}</h2>
          <p className="pp-sub">{t['pp.sub']}</p>
          <p className="pp-desc">{t['pp.desc']}</p>
          <div className="accent-line"></div>
        </div>
        <div className="pp-grid">
          <a href="https://www.usdc.com/" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/usdc.png" alt="USDC" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>USDC</h3>
            <p>{t['pp.p1desc']}</p>
          </a>
          <a href="https://habsburg.org/" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/habsburg.png" alt="Habsburg" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>Habsburg</h3>
            <p>{t['pp.p2desc']}</p>
          </a>
          <a href="https://themastera.xyz" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/themastera.png" alt="TheMastera" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>TheMastera</h3>
            <p>{t['pp.p3desc']}</p>
          </a>
          <a href="https://www.bifu.co" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/bifu.png" alt="BiFu" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>BiFu</h3>
            <p>{t['pp.p4desc']}</p>
          </a>
          <a href="https://wdcb.vip/" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/wdcb.png" alt="WDCB" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>WDCB</h3>
            <p>{t['pp.p5desc']}</p>
          </a>
          <a href="https://chain.link" target="_blank" className="pp-card">
            <div className="pp-card-icon"><img src="/images/chainlink.png" alt="Chainlink" style={{ width: 40, height: 40, objectFit: 'contain' }} /></div>
            <h3>Chainlink</h3>
            <p>{t['pp.p6desc']}</p>
          </a>
        </div>
        <div className="pp-other-support">
          <p>{t['pp.other']}</p>
        </div>
        <div className="pp-cta">
          <a href="#" className="pp-btn-cta" onClick={handleComingSoon}>{t['pp.cta']}</a>
        </div>
      </section>

      {/* Page 5: Ecosystem */}
      <section className="page-five" id="page-five">
        <div className="p5-header">
          <div className="p5-tag">{t['p5.tag']}</div>
          <h2>{t['p5.title']}</h2>
          <p>{t['p5.subtitle']}</p>
          <div className="p5-accent"></div>
        </div>
        <div className="p5-grid">
          <div className="p5-card">
            <div className="p5-icon">
              <svg viewBox="0 0 28 28" fill="none">
                <rect x="5" y="11" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="15" y="7" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M9 11V7a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h3>{t['p5.c1title']}</h3>
            <p>{t['p5.c1desc']}</p>
            <div className="p5-links">
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c1l1']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c1l2']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            </div>
          </div>
          <div className="p5-card">
            <div className="p5-icon">
              <svg viewBox="0 0 28 28" fill="none">
                <path d="M6 4h16v20H6z" stroke="currentColor" strokeWidth="2" rx="2" />
                <path d="M10 10h8M10 14h8M10 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3>{t['p5.c2title']}</h3>
            <p>{t['p5.c2desc']}</p>
            <div className="p5-links">
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c2l1']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c2l2']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            </div>
          </div>
          <div className="p5-card">
            <div className="p5-icon">
              <svg viewBox="0 0 28 28" fill="none">
                <circle cx="10" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M4 24c0-5 3-8 6-8s6 3 6 8M14 24c0-5 3-8 6-8s6 3 6 8" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h3>{t['p5.c3title']}</h3>
            <p>{t['p5.c3desc']}</p>
            <div className="p5-links">
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c3l1']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c3l2']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            </div>
          </div>
          <div className="p5-card">
            <div className="p5-icon">
              <svg viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M6 26c0-6 4-10 8-10s8 4 8 10" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h3>{t['p5.c4title']}</h3>
            <p>{t['p5.c4desc']}</p>
            <div className="p5-links">
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c4l1']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
              <a href="#" className="p5-link" onClick={handleComingSoon}>{t['p5.c4l2']} <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/images/logo.png" alt="META ASSETS" />
                <span>META ASSETS</span>
              </div>
              <p className="footer-desc">{t['footer.desc']}</p>
              <div className="footer-socials">
                <a href="#" className="footer-social" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="#" className="footer-social" aria-label="Telegram"><i className="fab fa-telegram-plane"></i></a>
                <a href="#" className="footer-social" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="#" className="footer-social" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>{t['footer.col1h']}</h4>
                <Link to="/whitepaper-technical">{t['footer.col1l1']}</Link>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col1l5']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col2h']}</h4>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l1']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col2l5']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col3h']}</h4>
                <a href="#">Twitter</a>
                <a href="#">Telegram</a>
                <a href="#">Discord</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col3l4']}</a>
              </div>
              <div className="footer-col">
                <h4>{t['footer.col4h']}</h4>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l1']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l2']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l3']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l4']}</a>
                <a href="#" onClick={handleComingSoon}>{t['footer.col4l5']}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t['footer.copy']}</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <div id="coming-soon-modal" className={`coming-soon-modal ${modalActive ? 'active' : ''}`}>
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 16V28M24 34V36" stroke="#00E5C4" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="coming-soon-title">{t['modal.title']}</h3>
        </div>
      </div>
    </>
  );
}

export default App;
