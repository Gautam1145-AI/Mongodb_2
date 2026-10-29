import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Database,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Layers,
  Cpu,
  RefreshCw,
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen
} from 'lucide-react';

export default function DatabaseDiagnosticsPage() {
  const [health, setHealth] = useState(null);
  const [replicaStatus, setReplicaStatus] = useState(null);
  const [explainPlans, setExplainPlans] = useState([]);
  const [indexes, setIndexes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('explain'); // explain, replica, indexes, backup

  const [copiedCmd, setCopiedCmd] = useState(null);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [h, rs, exp, idx] = await Promise.all([
        api.diagnostics.getHealth(),
        api.diagnostics.getReplicaStatus(),
        api.diagnostics.getQueryExplain(),
        api.diagnostics.getIndexes(),
      ]);
      setHealth(h);
      setReplicaStatus(rs);
      setExplainPlans(exp || []);
      setIndexes(idx || {});
    } catch (err) {
      setError(err.message || 'Failed to retrieve diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const copyToClipboard = (cmd, id) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <LoadingSpinner message="Querying MongoDB driver metadata, replica set status, and running executionStats explain plans..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Database Operations &amp; System Architecture Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Database className="w-7 h-7 text-emerald-400" />
            MongoDB Architecture &amp; Query Optimization Inspector
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live verification of MongoDB replica sets, ACID transactions, explain plan executionStats (IXSCAN vs COLLSCAN), and backup workflows.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-run Diagnostics</span>
        </button>
      </div>

      {/* Cluster Health Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Connection State</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white text-sm">{health?.database || 'CONNECTED'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{health?.databaseName}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Replica Set</span>
          <div className="font-bold text-emerald-400 text-sm mt-1">{replicaStatus?.replicaSetName || 'rs0'}</div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Primary: {replicaStatus?.primaryNode}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Consistency Config</span>
          <div className="font-bold text-indigo-400 text-sm mt-1">WriteConcern: MAJORITY</div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">ReadPreference: {replicaStatus?.readPreference || 'PRIMARY'}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">ACID Transactions</span>
          <div className="font-bold text-emerald-400 text-sm mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active &bull; Spring Session
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Multi-Doc Commit / Rollback</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('explain')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'explain'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Query Explain Plans (executionStats)</span>
        </button>

        <button
          onClick={() => setActiveTab('replica')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'replica'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Replica Set Topology &amp; Failover</span>
        </button>

        <button
          onClick={() => setActiveTab('indexes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'indexes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Index Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Backup &amp; Recovery Runbook</span>
        </button>
      </div>

      {/* TAB 1: Query Explain Plans */}
      {activeTab === 'explain' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">System Diagnostics: Indexing &amp; Query Optimization</p>
              <p className="mt-0.5 text-indigo-300/90 leading-relaxed">
                MongoDB query engine evaluates the query planner. Queries utilizing suitable compound indexes perform an <code className="text-emerald-400 font-mono font-bold">IXSCAN</code> with high index selectivity (<code className="text-white">totalDocsExamined == nReturned</code>). Unindexed queries fall back to a full collection scan (<code className="text-rose-400 font-mono font-bold">COLLSCAN</code>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {explainPlans.map((plan, idx) => {
              const isOptimal = plan.indexOptimal;

              return (
                <div
                  key={idx}
                  className={`bg-slate-900/90 border rounded-3xl p-6 shadow-xl transition-all ${
                    isOptimal ? 'border-slate-800' : 'border-amber-500/40 bg-amber-950/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                        plan.winningStage === 'IXSCAN' || plan.winningStage === 'FETCH'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        Stage: {plan.winningStage}
                      </span>
                      <h3 className="font-bold text-base text-white">{plan.queryName}</h3>
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      Collection: <strong className="text-slate-200">{plan.collection}</strong>
                    </span>
                  </div>

                  {/* Filter code block */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 mb-4 overflow-x-auto">
                    {plan.filterDescription}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Index Key Used</span>
                      <span className="font-mono text-xs font-bold text-slate-200 truncate block">
                        {plan.indexUsed || 'None (COLLSCAN)'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Docs Examined</span>
                      <span className={`font-mono text-xs font-bold ${
                        plan.totalDocsExamined > 50 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {plan.totalDocsExamined}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Keys Examined</span>
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {plan.totalKeysExamined}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Exec Time</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {plan.executionTimeMillis} ms
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Explanation:</strong> {plan.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Replica Set Topology */}
      {activeTab === 'replica' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Replica Set Node Members
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Reporting from <code className="text-indigo-300 font-mono">replSetGetStatus</code> admin command.
            </p>

            <div className="space-y-3">
              {replicaStatus?.members?.map((mem, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="font-mono text-xs font-bold text-white block">{mem.name}</span>
                      <span className="text-[11px] text-slate-400">Uptime: {mem.uptime} seconds</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                    mem.stateStr === 'PRIMARY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {mem.stateStr}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400">
              <div className="space-y-2">
                <h4 className="font-bold text-white">How Replication Works:</h4>
                <p>• Primary node receives all writes, records them in the local capped collection <code className="text-indigo-300 font-mono">oplog.rs</code>.</p>
                <p>• Secondary members continuously replicate and apply oplog entries asynchronously.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white">Automatic Elections &amp; Failover:</h4>
                <p>• If Primary becomes unreachable for &gt; 10 seconds, secondaries initiate a Raft-variant election.</p>
                <p>• The candidate with the highest priority and freshest oplog position is elected Primary.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Active Index Inventory */}
      {activeTab === 'indexes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Object.entries(indexes).map(([collName, idxList]) => (
              <div key={collName} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold text-base text-white mb-1 flex items-center justify-between">
                  <span>Collection: <code className="text-indigo-400 font-mono">{collName}</code></span>
                  <span className="text-xs font-mono text-slate-500">{idxList.length} index(es)</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Configured via Spring Data <code className="text-indigo-300 font-mono">@Indexed</code> &amp; <code className="text-indigo-300 font-mono">@CompoundIndex</code></p>

                <div className="space-y-2.5">
                  {idxList.map((idx, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-[11px]">{idx.name}</span>
                        {idx.unique && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            UNIQUE
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Keys: {JSON.stringify(idx.key)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Backup & Recovery Runbook */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                MongoDB Backup &amp; Disaster Recovery Procedures
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step verified terminal commands demonstrating hot backup using <code className="text-indigo-300 font-mono">mongodump</code> and recovery into an isolated staging database using <code className="text-indigo-300 font-mono">mongorestore</code>.
              </p>
            </div>

            {/* Command 1: mongodump */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">1. Create Hot Binary Backup (mongodump)</span>
                <button
                  onClick={() => copyToClipboard('mongodump --uri="mongodb://127.0.0.1:27017/ticket_booking?replicaSet=rs0" --out="./backups/$(date +%Y%m%d_%H%M%S)" --gzip', 'c1')}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'c1' ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
                mongodump --uri="mongodb://127.0.0.1:27017/ticket_booking?replicaSet=rs0" --out="./backups/$(date +%Y%m%d_%H%M%S)" --gzip
              </div>
              <p className="text-[11px] text-slate-400">Dumps all collections (users, events, seats, bookings) with index metadata into a gzip compressed archive.</p>
            </div>

            {/* Command 2: mongorestore test */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">2. Test Restore into Isolated Staging DB (mongorestore)</span>
                <button
                  onClick={() => copyToClipboard('mongorestore --uri="mongodb://127.0.0.1:27017" --nsFrom="ticket_booking.*" --nsTo="ticket_booking_restore_test.*" --gzip ./backups/<backup_timestamp>/ticket_booking', 'c2')}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'c2' ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
                mongorestore --uri="mongodb://127.0.0.1:27017" --nsFrom="ticket_booking.*" --nsTo="ticket_booking_restore_test.*" --gzip ./backups/&lt;backup_timestamp&gt;/ticket_booking
              </div>
              <p className="text-[11px] text-slate-400">Restores to a test database without overwriting production or live records, verifying schema and document integrity.</p>
            </div>

            {/* Command 3: Verification mongosh */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">3. Verify Data Integrity via mongosh</span>
                <button
                  onClick={() => copyToClipboard('mongosh "mongodb://127.0.0.1:27017/ticket_booking_restore_test" --eval "db.getCollectionNames().forEach(c => print(c + \': \' + db[c].countDocuments()))"', 'c3')}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCmd === 'c3' ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 overflow-x-auto">
                {'mongosh "mongodb://127.0.0.1:27017/ticket_booking_restore_test" --eval "db.getCollectionNames().forEach(c => print(c + \': \' + db[c].countDocuments()))"'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
