import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { AgentRegistrationDialog } from './AgentRegistrationDialog';

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  email: string;
  telephone: string;
}

interface AgentSelectProps {
  value?: string;
  onValueChange: (value: string, agentCode?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AgentSelect: React.FC<AgentSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select agent...',
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, agent_code, full_name, email, telephone')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const selectedAgent = agents.find(agent => agent.agent_code === value);

  const handleAgentCreated = (newAgent: { id: string; agent_code: string; full_name: string }) => {
    // Refresh the list and select the new agent
    fetchAgents().then(() => {
      onValueChange(newAgent.agent_code, newAgent.agent_code);
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading agents...
              </span>
            ) : selectedAgent ? (
              <span className="truncate">
                {selectedAgent.agent_code} - {selectedAgent.full_name}
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name or code..." />
            <CommandList>
              <CommandEmpty>No agent found.</CommandEmpty>
              <CommandGroup heading="Registered Agents">
                {agents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={`${agent.agent_code} ${agent.full_name} ${agent.email}`}
                    onSelect={() => {
                      onValueChange(agent.agent_code, agent.agent_code);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === agent.agent_code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {agent.agent_code}
                        </span>
                        <span className="font-medium truncate">{agent.full_name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {agent.email} • {agent.telephone}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowRegistration(true);
                  }}
                  className="text-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register New Agent
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AgentRegistrationDialog
        open={showRegistration}
        onOpenChange={setShowRegistration}
        onAgentCreated={handleAgentCreated}
      />
    </>
  );
};
