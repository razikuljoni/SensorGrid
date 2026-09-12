'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useOrg } from '@/lib/hooks';
import { Cpu, KeyRound, MapPin, Users, Zap } from 'lucide-react';

export function SettingsView() {
  const { data, isLoading } = useOrg();
  const org = data?.organization;
  const members = data?.members ?? [];
  const stats = data?.stats;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 sm:gap-6 sm:p-6 max-w-5xl">
      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4" /> Organization
          </CardTitle>
          <CardDescription>Your SensorGrid workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || !org ? (
            <div className="h-20 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold">
                    NH
                  </div>
                  <div>
                    <p className="text-base font-semibold">{org.name}</p>
                    <p className="text-xs text-text-muted font-mono">{org.slug}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {org.plan} plan
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon={Cpu} label="Devices" value={stats?.deviceCount ?? 0} />
                <StatBox icon={Zap} label="Automations" value={stats?.automationCount ?? 0} />
                <StatBox icon={Users} label="Members" value={members.length} />
                <StatBox icon={KeyRound} label="Plan" value={org.plan} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" /> Members
          </CardTitle>
          <CardDescription>RBAC roles and team members</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-text-muted">No members.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m: any) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {m.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.user.name}</p>
                    <p className="text-xs text-text-muted truncate">{m.user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" className="mt-3 text-xs" disabled>
            Invite member (coming soon)
          </Button>
        </CardContent>
      </Card>

      {/* Integrations (informational) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="size-4" /> Integrations
          </CardTitle>
          <CardDescription>External services connected to this workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <IntegrationRow name="MQTT Broker" status="Connected" detail="mosquitto · port 1883" />
          <IntegrationRow
            name="Realtime Service"
            status="Connected"
            detail="socket.io · port 3003"
          />
          <IntegrationRow
            name="Email (SMTP)"
            status="Not configured"
            detail="Required for alert notifications"
          />
          <IntegrationRow name="Sentry" status="Not configured" detail="Error tracking" />
          <IntegrationRow
            name="OpenTelemetry"
            status="Not configured"
            detail="Distributed tracing"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-text-muted">
        <Icon className="size-3" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function IntegrationRow({
  name,
  status,
  detail,
}: {
  name: string;
  status: string;
  detail: string;
}) {
  const connected = status === 'Connected';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-text-muted font-mono truncate">{detail}</p>
      </div>
      <Badge
        variant={connected ? 'default' : 'outline'}
        className={connected ? 'bg-success/15 text-success border-success/30' : ''}
      >
        <span
          className={`aether-status-dot mr-1 ${connected ? 'text-success' : 'text-text-muted'}`}
          style={{ color: connected ? 'var(--success)' : 'var(--text-muted)' }}
        />
        {status}
      </Badge>
    </div>
  );
}
