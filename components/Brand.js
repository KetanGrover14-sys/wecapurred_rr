import Image from 'next/image';

export default function Brand({ compact = false }) {
  return <span className={`partner-brand ${compact ? 'partner-brand-compact' : ''}`}>
    <Image src="/images/apollopharmacy.png" alt="Apollo Pharmacy" width={500} height={365} priority className="partner-apollo" />
    <span className="partner-secondary"><span aria-hidden="true">×</span><Image src="/images/norrvexlabs.png" alt="Norrvex Labs" width={219} height={159} className="partner-norrvex" /></span>
  </span>;
}
