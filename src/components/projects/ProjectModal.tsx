
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CalendarIcon, X, Plus, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Define Project interface if it's not imported properly
interface Project {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  clientId: string;
  status?: "Not Started" | "In Progress" | "Complete";
  dueDate?: string | Date;
  startDate?: string | Date;
  assigneeId?: string;
  teamMemberIds?: string[];
  repeating?: boolean;
  isRecurring?: boolean;
  templateId?: string;
}

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  withCredentials: true
});

// Add auth token if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Form schema
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  assigneeId: z.string().optional(),
  teamMemberIds: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  templateId: z.string().optional(),
  status: z.enum(["Not Started", "In Progress", "Complete"]).default("Not Started"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  project?: Project;
  isEditing?: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
  onUpdated?: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ 
  project, 
  isEditing = false, 
  onClose, 
  onCreated, 
  onUpdated 
}) => {
  const [open, setOpen] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);

  // Fetch clients data with fallback
  const { 
    data: clientsData = [], 
    isLoading: clientsLoading 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const response = await api.get('/clients');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching clients:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Fetch team members data with fallback
  const { 
    data: teamMembersData = [],
    isLoading: teamMembersLoading 
  } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      try {
        const response = await api.get('/team-members');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Fetch templates data with fallback
  const { 
    data: templatesData = [],
    isLoading: templatesLoading 
  } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const response = await api.get('/templates');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    },
    retry: 1,
  });
  
  // Ensure arrays are always defined
  const clients = Array.isArray(clientsData) ? clientsData : [];
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : [];
  const templates = Array.isArray(templatesData) ? templatesData : [];

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      try {
        // Format the data for the backend
        const formattedData = {
          ...data,
          assigneeId: data.assigneeId === 'none' ? null : data.assigneeId,
          teamMemberIds: Array.isArray(data.teamMemberIds) ? data.teamMemberIds : []
        };
        
        console.log('Sending project data:', formattedData);
        const response = await api.post('/projects', formattedData);
        return response.data;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Project created successfully');
      if (onCreated) onCreated(data._id || data.id);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to create project';
      toast.error(errorMessage);
    }
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectFormValues }) => {
      try {
        // Format the data for the backend
        const formattedData = {
          ...data,
          assigneeId: data.assigneeId === 'none' ? null : data.assigneeId,
          teamMemberIds: Array.isArray(data.teamMemberIds) ? data.teamMemberIds : []
        };
        
        console.log('Updating project data:', formattedData);
        const response = await api.patch(`/projects/${id}`, formattedData);
        return response.data;
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
      if (onUpdated) onUpdated();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to update project';
      toast.error(errorMessage);
    }
  });

  // Get default values for the form
  const getDefaultValues = () => {
    // Default form values when creating a new project
    const defaultValues: ProjectFormValues = {
      name: '',
      description: '',
      clientId: '',
      assigneeId: 'none',
      teamMemberIds: [],
      isRecurring: false,
      startDate: new Date(),
      templateId: '',
      status: 'Not Started',
    };

    // If editing an existing project, override with its values
    if (project && isEditing) {
      return {
        name: project.name || defaultValues.name,
        description: project.description || defaultValues.description,
        clientId: project.clientId || defaultValues.clientId,
        assigneeId: project.assigneeId || 'none',
        teamMemberIds: Array.isArray(project.teamMemberIds) ? project.teamMemberIds : [],
        isRecurring: project.repeating || project.isRecurring || defaultValues.isRecurring,
        startDate: project.startDate ? new Date(project.startDate) : 
                  project.dueDate ? new Date(project.dueDate) : defaultValues.startDate,
        templateId: project.templateId || defaultValues.templateId,
        status: (project.status as any) || defaultValues.status,
      };
    }

    return defaultValues;
  };

  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: getDefaultValues(),
  });

  // Update form when editing project or when project data changes
  useEffect(() => {
    if (project && isEditing) {
      form.reset(getDefaultValues());
    }
  }, [project, isEditing, form]);

  const onSubmit = async (values: ProjectFormValues) => {
    console.log('Submitting form with values:', values);
    
    if (isEditing && project) {
      const projectId = project.id || project._id;
      if (projectId) {
        updateMutation.mutate({ id: projectId, data: values });
      } else {
        toast.error('Cannot update project: Missing project ID');
      }
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isRecurring = form.watch('isRecurring');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start from a Template</FormLabel>
                  <Popover open={openTemplates} onOpenChange={setOpenTemplates}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTemplates}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? templates.find((template) => (template.id || template._id) === field.value)?.name || "Don't use a template"
                            : "Don't use a template"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search templates..." />
                        <CommandEmpty>No template found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              form.setValue("templateId", "");
                              setOpenTemplates(false);
                            }}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Don't use a template
                          </CommandItem>
                          {templates.map((template) => (
                            <CommandItem
                              key={template.id || template._id || Math.random().toString()}
                              onSelect={() => {
                                form.setValue("templateId", template.id || template._id || "");
                                setOpenTemplates(false);
                              }}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === (template.id || template._id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {template.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Type your project name here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Type your project description here..." 
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">Client</FormLabel>
                    <div className="flex space-x-2">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.length > 0 ? (
                            clients.map((client: any) => (
                              <SelectItem 
                                key={client._id || client.id || Math.random().toString()} 
                                value={client._id || client.id || ''}
                              >
                                {client.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-clients">No clients available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button" 
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => alert("New Client feature to be implemented")}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Assignee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a Team Member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member: any) => (
                            <SelectItem 
                              key={member._id || member.id || Math.random().toString()} 
                              value={member._id || member.id || ''}
                            >
                              {member.name}
                            </SelectItem>
                          ))
                        ) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamMemberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <div className="rounded-md border p-4">
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2">
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member) => {
                            const id = member._id || member.id || '';
                            // Ensure field.value is always an array
                            const fieldValue = Array.isArray(field.value) ? field.value : [];
                            const isSelected = id ? fieldValue.includes(id) : false;
                            
                            return (
                              <div key={id || Math.random().toString()} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`member-${id}`}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    // Make sure we're working with arrays
                                    const currentValues = Array.isArray(field.value) ? [...field.value] : [];
                                    if (checked && id) {
                                      field.onChange([...currentValues, id]);
                                    } else if (id) {
                                      field.onChange(currentValues.filter(v => v !== id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <label 
                                  htmlFor={`member-${id}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {member.name}
                                </label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-gray-500">No team members available</div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Press ctrl or ⌘ to select multiple
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['?'] after:ml-0.5">Is this a repeating project</FormLabel>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={field.value ? "default" : "outline"}
                      className={field.value ? "bg-blue-500 hover:bg-blue-600" : ""}
                      onClick={() => form.setValue("isRecurring", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={!field.value ? "default" : "outline"}
                      className={!field.value ? "bg-blue-500 hover:bg-blue-600" : ""}
                      onClick={() => form.setValue("isRecurring", false)}
                    >
                      No, this is a one-off
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                    Schedule starts
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? (
                  isEditing ? 'Updating...' : 'Creating...'
                ) : (
                  isEditing ? 'Update Project' : 'Create Project'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
