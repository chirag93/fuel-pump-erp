
import React, { useState } from 'react';
import { AccountingPageLayout } from '@/components/accounting/AccountingPageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BarChart3, FileText } from 'lucide-react';

const ExpenseCategories = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryTaxable, setNewCategoryTaxable] = useState(true);
  
  // Sample categories data
  const [categories, setCategories] = useState([
    { id: 'cat1', name: 'Fuel Purchases', description: 'All fuel purchases for resale', taxable: true },
    { id: 'cat2', name: 'Maintenance', description: 'Equipment and facility maintenance', taxable: true },
    { id: 'cat3', name: 'Utilities', description: 'Electricity, water, and other utilities', taxable: true },
    { id: 'cat4', name: 'Salaries', description: 'Staff salaries and wages', taxable: false },
    { id: 'cat5', name: 'Office Supplies', description: 'Office consumables and supplies', taxable: true },
    { id: 'cat6', name: 'Insurance', description: 'Business insurance premiums', taxable: false },
  ]);
  
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const newCategory = {
      id: `cat${categories.length + 1}`,
      name: newCategoryName,
      description: newCategoryDescription,
      taxable: newCategoryTaxable
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryTaxable(true);
    setNewCategoryOpen(false);
    
    toast({
      title: "Category Added",
      description: `"${newCategoryName}" has been added successfully.`
    });
  };
  
  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(cat => cat.id === id);
    if (!categoryToDelete) return;
    
    setCategories(categories.filter(cat => cat.id !== id));
    
    toast({
      title: "Category Deleted",
      description: `"${categoryToDelete.name}" has been deleted.`
    });
  };
  
  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <AccountingPageLayout 
      title="Expense Categories" 
      description="Manage and organize expense categories for better financial tracking."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>
                Create and manage expense categories for accounting
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search categories..."
                  className="w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new expense category for accounting purposes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter description"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="taxable"
                        checked={newCategoryTaxable}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          if (typeof checked === 'boolean') {
                            setNewCategoryTaxable(checked);
                          }
                        }}
                      />
                      <label
                        htmlFor="taxable"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Taxable (GST Applicable)
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>
                      Add Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Taxable</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      {category.taxable ? 
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span> : 
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Expense Distribution
              </CardTitle>
              <CardDescription>
                Expense breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart will be implemented in future updates
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Reports
              </CardTitle>
              <CardDescription>
                GST reports by expense category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-3 border rounded-md">
                  <div>
                    <h4 className="text-sm font-medium">GST Summary by Category</h4>
                    <p className="text-xs text-muted-foreground">Current quarter breakdown</p>
                  </div>
                  <Button size="sm" variant="outline">Generate</Button>
                </div>
                <div className="flex justify-between p-3 border rounded-md">
                  <div>
                    <h4 className="text-sm font-medium">Quarterly GST Report</h4>
                    <p className="text-xs text-muted-foreground">For tax filing purposes</p>
                  </div>
                  <Button size="sm" variant="outline">Generate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AccountingPageLayout>
  );
};

export default ExpenseCategories;
