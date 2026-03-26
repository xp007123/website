import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { translations } from './translations';
import './WhitepaperTechnical.css';

const PDF_URL = 'https://oss-file.s3.ap-northeast-1.amazonaws.com/POCC%EF%BC%88Proof+of+Computation+Capacity%EF%BC%89%E5%85%B1%E8%AF%86%E3%80%81TSS+%E6%B2%BB%E7%90%86%E4%B8%8E+RWA+%E7%AE%97%E5%8A%9B%E8%B5%84%E4%BA%A7%E5%8C%96%E4%BD%93%E7%B3%BB.pdf';

const tocItems = [
  { id: 'sec-abstract', key: 'wp.toc_abstract' },
  { id: 'sec-intro', key: 'wp.toc_intro' },
  { id: 'sec-goals', key: 'wp.toc_goals' },
  { id: 'sec-arch', key: 'wp.toc_arch' },
  { id: 'sec-pocc', key: 'wp.toc_pocc' },
  { id: 'sec-pocc-primitives', key: 'wp.toc_pocc_prim', sub: true },
  { id: 'sec-tss-gov', key: 'wp.toc_tss_gov', sub: true },
  { id: 'sec-cu', key: 'wp.toc_cu' },
  { id: 'sec-cu-def', key: 'wp.toc_cu_def', sub: true },
  { id: 'sec-cu-mint', key: 'wp.toc_cu_mint', sub: true },
  { id: 'sec-cu-lifecycle', key: 'wp.toc_cu_lifecycle', sub: true },
  { id: 'sec-econ', key: 'wp.toc_econ' },
  { id: 'sec-security', key: 'wp.toc_security' },
  { id: 'sec-impl', key: 'wp.toc_impl' },
  { id: 'sec-compare', key: 'wp.toc_compare' },
  { id: 'sec-future', key: 'wp.toc_future' },
  { id: 'sec-refs', key: 'wp.toc_refs' },
];

const PSEUDOCODE = `// Epoch e lifecycle
OnEpochStart(e):
    seed_e <- Hash(block_{e-1}.finalized_root)
    committee_e <- SelectValidatorsByWeight(W_{e-1}, seed_e)
    Publish(committee_e, seed_e)

DuringEpoch(e):
    for each round r:
        proposer <- VRF_Sample(committee_e, W_e, seed_e, r)
        block <- proposer.BuildBlock(mempool)
        votes <- BFT_Vote(block, committee_e)
        if votes >= 2f+1:
            Finalize(block)

OnEpochEnd(e):
    receipt_root <- OffchainAggregateComputeReceipts(e)
    sig <- TSS_Sign(receipt_root, committee_e)
    SubmitOnchain(receipt_root, sig)
    UpdateWeights(W_{e+1})`;

const SOLIDITY_CODE = `interface ICapacityUnit is IERC721 {
    enum Status { Pending, Active, Suspended, Revoked, Retired }

    struct CapacityMeta {
        bytes32 deviceIdHash;
        uint64  validFrom;
        uint64  validTo;
        uint256 ncs;           // normalized capacity score
        Status  status;
        bytes32 evidenceRoot;  // offchain evidence Merkle root
    }

    event CapacityMinted(uint256 indexed tokenId, bytes32 indexed deviceIdHash, uint256 ncs);
    event CapacityStatusChanged(uint256 indexed tokenId, Status from, Status to, bytes32 reasonHash);
    event CapacityDelegated(uint256 indexed tokenId, address indexed validator, uint256 weight);

    function getCapacityMeta(uint256 tokenId) external view returns (CapacityMeta memory);
    function setStatus(uint256 tokenId, Status to, bytes32 reasonHash, bytes calldata tssSig) external;
    function delegateToValidator(uint256 tokenId, address validator, uint256 weight) external;
}

interface ITSSKeyRegistry {
    event TSSKeyRotated(uint256 indexed epoch, bytes32 indexed keyId, bytes pubkeyBytes);
    function currentKeyId() external view returns (bytes32);
    function currentPubkey() external view returns (bytes memory);
    function isValidSignature(bytes32 msgHash, bytes calldata sig) external view returns (bool);
}`;

const references = [
  '[1] A Peer-to-Peer Electronic Cash System — bitcoin.org/bitcoin.pdf',
  '[2] A Provably Secure Proof-of-Stake Blockchain Protocol — eprint.iacr.org/2016/889',
  '[3] SpaceMint: A Cryptocurrency Based on Proofs of Space',
  '[4] On Elapsed Time Consensus Protocols — eprint.iacr.org/2021/086',
  '[5] OpenZeppelin Governance — docs.openzeppelin.com',
  '[6] FATF Updated Guidance for a Risk-Based Approach — fatf-gafi.org',
  '[7] Cambridge Blockchain Network Sustainability Index: CBECI',
  '[8] Practical Byzantine Fault Tolerance — csail.mit.edu',
  '[9] BIS — Tokenisation in the context of money and other assets',
  '[10] FSB — The Financial Stability Implications of Tokenisation',
  '[11] RFC 9591 — FROST Threshold Signatures — datatracker.ietf.org',
  '[12] ERC-721: Non-Fungible Token Standard — eips.ethereum.org',
  '[13] HotStuff: BFT Consensus in the Lens of Blockchain — arxiv.org',
  '[14] Tendermint: Consensus without Mining',
  '[15] Verifiable Random Functions — csail.mit.edu',
  '[16] EIP-712: Typed structured data hashing and signing',
  '[17] ERC-1967: Proxy Storage Slots — eips.ethereum.org',
  '[18] ERC-3525: Semi-Fungible Token — eips.ethereum.org',
  '[19] IOSCO Policy Recommendations for Crypto and Digital Asset Markets',
];

function WhitepaperTechnical() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [activeSection, setActiveSection] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const mainRef = useRef(null);

  const t = translations[lang];

  useEffect(() => {
    document.title = t['wp.title'];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.body.classList.toggle('lang-zh', lang === 'zh');
    window.scrollTo(0, 0);
    return () => {
      document.body.classList.remove('lang-zh');
    };
  }, [lang, t]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 400);
      const sections = document.querySelectorAll('.wp-section');
      let currentId = '';
      sections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= 120) currentId = sec.id;
      });
      setActiveSection(currentId);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleTocClick = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };

  return (
    <div className={`wp-page ${lang === 'zh' ? 'lang-zh' : ''}`}>
      {/* Top Nav */}
      <nav className="wp-top-nav">
        <div className="wp-top-nav-left">
          <Link to="/" className="wp-top-nav-logo">
            <img src="/images/logo.png" alt="META ASSETS" />
            <span>META ASSETS</span>
          </Link>
          <Link to="/" className="wp-top-nav-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{t['wp.back_home']}</span>
          </Link>
        </div>
        <div className="wp-top-nav-right">
          <button className="wp-lang-switch" onClick={toggleLang}>
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <a href={PDF_URL} download className="wp-download-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span className="wp-dl-text">{t['wp.download']}</span>
          </a>
        </div>
      </nav>

      <div className="wp-wrapper">
        {/* Sidebar TOC */}
        <aside className={`wp-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="wp-toc-title">{t['wp.toc']}</div>
          {tocItems.map(item => (
            <a
              key={item.id}
              className={`wp-toc-link ${item.sub ? 'sub' : ''} ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleTocClick(item.id)}
            >
              {t[item.key]}
            </a>
          ))}
        </aside>

        {/* Main Content */}
        <main className="wp-main" ref={mainRef}>
          {/* Hero */}
          <div className="wp-hero">
            <div className="wp-hero-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
              <span>{t['wp.badge']}</span>
            </div>
            <h1>{t['wp.hero_title']}</h1>
            <div className="wp-hero-sub">{t['wp.hero_sub']}</div>
            <div className="wp-hero-meta">
              <span>META ASSETS Foundation</span>
              <span>v1.0</span>
              <span>2025</span>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="wp-section" id="sec-abstract">
            <h2>{t['wp.s_abstract']}</h2>
            <p>{t['wp.abstract_p1']}</p>
            <p>{t['wp.abstract_p2']}</p>
            <p>{t['wp.abstract_p3']}</p>
            <p>{t['wp.abstract_p4']}</p>
          </section>

          {/* Introduction */}
          <section className="wp-section" id="sec-intro">
            <h2>{t['wp.s_intro']}</h2>
            <p>{t['wp.intro_p1']}</p>
            <p>{t['wp.intro_p2']}</p>
            <p>{t['wp.intro_p3']}</p>
            <p>{t['wp.intro_p4']}</p>
            <p>{t['wp.intro_p5']}</p>
            <p>{t['wp.intro_p6']}</p>
          </section>

          {/* Design Goals */}
          <section className="wp-section" id="sec-goals">
            <h2>{t['wp.s_goals']}</h2>
            <p>{t['wp.goals_p1']}</p>
            <ol>
              {[1,2,3,4,5,6].map(i => <li key={i}>{t[`wp.goal${i}`]}</li>)}
            </ol>
            <h3>{t['wp.params_title']}</h3>
            <div className="wp-table-wrap">
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>{t['wp.param_col1']}</th>
                    <th>{t['wp.param_col2']}</th>
                    <th>{t['wp.param_col3']}</th>
                  </tr>
                </thead>
                <tbody>
                  {t['wp.param_rows']?.map((row, i) => (
                    <tr key={i}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Architecture */}
          <section className="wp-section" id="sec-arch">
            <h2>{t['wp.s_arch']}</h2>
            <p>{t['wp.arch_p1']}</p>
            <p>{t['wp.arch_p2']}</p>
            <h3>{t['wp.arch_contracts']}</h3>
            <div className="wp-callout">
              {t['wp.arch_components']?.map((c, i) => <p key={i}><strong>{c.split(' — ')[0]}</strong> — {c.split(' — ')[1]}</p>)}
            </div>
            <p>{t['wp.arch_p3']}</p>
            <p>{t['wp.arch_p4']}</p>
          </section>

          {/* POCC Consensus */}
          <section className="wp-section" id="sec-pocc">
            <h2>{t['wp.s_pocc']}</h2>
            <p>{t['wp.pocc_p1']}</p>
            <p>{t['wp.pocc_p2']}</p>
          </section>

          {/* POCC Primitives */}
          <section className="wp-section" id="sec-pocc-primitives">
            <h3>{t['wp.s_pocc_prim']}</h3>
            <p>{t['wp.pocc_decouple']}</p>
            <ol>
              {t['wp.pocc_prims']?.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
            <h3>{t['wp.pseudocode_title']}</h3>
            <div className="wp-code"><pre>{PSEUDOCODE}</pre></div>
          </section>

          {/* TSS Governance */}
          <section className="wp-section" id="sec-tss-gov">
            <h3>{t['wp.s_tss_gov']}</h3>
            <p>{t['wp.tss_gov_p1']}</p>
            <ul>
              {t['wp.tss_gov_items']?.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p>{t['wp.tss_gov_p2']}</p>
          </section>

          {/* Capacity Unit */}
          <section className="wp-section" id="sec-cu">
            <h2>{t['wp.s_cu']}</h2>
          </section>

          <section className="wp-section" id="sec-cu-def">
            <h3>{t['wp.s_cu_def']}</h3>
            <p>{t['wp.cu_def_p1']}</p>
            <p>{t['wp.cu_def_p2']}</p>
            <p>{t['wp.cu_def_p3']}</p>
          </section>

          <section className="wp-section" id="sec-cu-mint">
            <h3>{t['wp.s_cu_mint']}</h3>
            <p>{t['wp.cu_mint_p1']}</p>
            <ol>
              {t['wp.cu_mint_steps']?.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </section>

          <section className="wp-section" id="sec-cu-lifecycle">
            <h3>{t['wp.s_cu_lifecycle']}</h3>
            <p>{t['wp.cu_lifecycle_p1']}</p>
            <div className="wp-callout"><p><em>{t['wp.cu_lifecycle_states']}</em></p></div>
            <p>{t['wp.cu_lifecycle_p2']}</p>
          </section>

          {/* Economics */}
          <section className="wp-section" id="sec-econ">
            <h2>{t['wp.s_econ']}</h2>
            <p>{t['wp.econ_p1']}</p>
            <h3>{t['wp.econ_staking']}</h3>
            <p>{t['wp.econ_staking_p1']}</p>
            <h3>{t['wp.econ_records']}</h3>
            <p>{t['wp.econ_records_p1']}</p>
            <ol>
              {t['wp.econ_evidence']?.map((e, i) => <li key={i}>{e}</li>)}
            </ol>
            <h3>{t['wp.econ_model']}</h3>
            <ul>
              {t['wp.econ_incentives']?.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </section>

          {/* Security */}
          <section className="wp-section" id="sec-security">
            <h2>{t['wp.s_security']}</h2>
            <h3>{t['wp.sec_analysis']}</h3>
            <p>{t['wp.sec_p1']}</p>
            <h3>{t['wp.sec_pocc_attack']}</h3>
            <ul>
              {t['wp.sec_attacks']?.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
            <h3>{t['wp.sec_compliance']}</h3>
            <ol>
              {t['wp.sec_compliance_items']?.map((c, i) => <li key={i}>{c}</li>)}
            </ol>
          </section>

          {/* Implementation */}
          <section className="wp-section" id="sec-impl">
            <h2>{t['wp.s_impl']}</h2>
            <h3>{t['wp.impl_interfaces']}</h3>
            <div className="wp-interface"><pre>{SOLIDITY_CODE}</pre></div>
            <h3>{t['wp.impl_events']}</h3>
            <p>{t['wp.impl_events_p1']}</p>
            <h3>{t['wp.impl_deploy']}</h3>
            <p>{t['wp.impl_deploy_p1']}</p>
            <ol>
              {t['wp.impl_deploy_stages']?.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </section>

          {/* Comparison */}
          <section className="wp-section" id="sec-compare">
            <h2>{t['wp.s_compare']}</h2>
            <div className="wp-table-wrap">
              <table className="wp-table">
                <thead>
                  <tr>
                    {t['wp.cmp_headers']?.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {t['wp.cmp_rows']?.map((row, i) => (
                    <tr key={i} className={i === (t['wp.cmp_rows'].length - 1) ? 'wp-highlight-row' : ''}>
                      {row.map((cell, j) => (
                        <td key={j} className={j === 0 && i === (t['wp.cmp_rows'].length - 1) ? 'wp-highlight-cell' : ''}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Future Work */}
          <section className="wp-section" id="sec-future">
            <h2>{t['wp.s_future']}</h2>
            <ol>
              {t['wp.future_items']?.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
            <p>{t['wp.future_p1']}</p>
          </section>

          {/* References */}
          <section className="wp-section" id="sec-refs">
            <h2>{t['wp.s_refs']}</h2>
            {references.map((ref, i) => (
              <div key={i} className="wp-ref">{ref}</div>
            ))}
          </section>
        </main>
      </div>

      {/* Footer */}
      <div className="wp-footer-bar">
        <p>{t['wp.footer']}</p>
      </div>

      {/* Back to top */}
      <button
        className={`wp-back-top ${showBackTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {/* Sidebar toggle (mobile) */}
      <button
        className="wp-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle table of contents"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
    </div>
  );
}

export default WhitepaperTechnical;
