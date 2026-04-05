import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useComboPackages, ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Upload, Pencil, ChevronDown, ChevronUp, X } from 'lucide-react';

const AdminCombo = () => {
  const { packages, menus, dishes, loading, fetchAll, getMenusByPackage, getDishesByMenu } = useComboPackages();
  const { toast } = useToast();
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [editingPkg, setEditingPkg] = useState<Partial<ComboPackage> | null>(null);
  const [uploading, setUploading] = useState(false);

  // New dish form
  const [newDishMenuId, setNewDishMenuId] = useState<string | null>(null);
  const [newDishName, setNewDishName] = useState('');
  const [newDishNameEn, setNewDishNameEn] = useState('');

  const uploadImage = async (file: File, path: string) => {
    const compressed = await compressImage(file);
    const { error } = await supabase.storage.from('site-assets').upload(path, compressed, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUploadPkgImage = async (pkgId: string, file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file, `combos/${pkgId}-${Date.now()}.jpg`);
      await supabase.from('combo_packages').update({ image_url: url }).eq('id', pkgId);
      toast({ title: 'Đã upload ảnh combo ✓' });
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Lỗi upload', description: e.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const savePkg = async (pkg: Partial<ComboPackage>) => {
    if (!pkg.id) return;
    const { error } = await supabase.from('combo_packages').update({
      name: pkg.name,
      price_per_person: pkg.price_per_person,
      description_vi: pkg.description_vi,
      description_en: pkg.description_en,
      dishes_per_menu: pkg.dishes_per_menu,
    }).eq('id', pkg.id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu combo ✓' });
    setEditingPkg(null);
    fetchAll();
  };

  const addMenu = async (pkgId: string) => {
    const existing = getMenusByPackage(pkgId);
    const nextNum = existing.length + 1;
    const { error } = await supabase.from('combo_menus').insert({
      combo_package_id: pkgId,
      menu_number: nextNum,
      name_vi: `Thực đơn ${nextNum}`,
      name_en: `Menu ${nextNum}`,
      sort_order: nextNum,
    });
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Đã thêm Thực đơn ${nextNum} ✓` });
    fetchAll();
  };

  const deleteMenu = async (menuId: string) => {
    if (!confirm('Xóa thực đơn này và tất cả món ăn?')) return;
    await supabase.from('combo_menus').delete().eq('id', menuId);
    toast({ title: 'Đã xóa thực đơn ✓' });
    fetchAll();
  };

  const addDish = async (menuId: string) => {
    if (!newDishName.trim()) return;
    const existing = getDishesByMenu(menuId);
    const { error } = await supabase.from('combo_menu_dishes').insert({
      combo_menu_id: menuId,
      name_vi: newDishName.trim(),
      name_en: newDishNameEn.trim() || newDishName.trim(),
      sort_order: existing.length + 1,
    });
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    setNewDishName('');
    setNewDishNameEn('');
    setNewDishMenuId(null);
    fetchAll();
  };

  const deleteDish = async (dishId: string) => {
    await supabase.from('combo_menu_dishes').delete().eq('id', dishId);
    fetchAll();
  };

  const updateDish = async (dishId: string, nameVi: string, nameEn: string) => {
    await supabase.from('combo_menu_dishes').update({ name_vi: nameVi, name_en: nameEn }).eq('id', dishId);
    fetchAll();
  };

  if (loading) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Quản lý Combo ăn uống</h2>

      {packages.map(pkg => {
        const pkgMenus = getMenusByPackage(pkg.id);
        const isExpanded = expandedPkg === pkg.id;
        const isEditing = editingPkg?.id === pkg.id;

        return (
          <div key={pkg.id} className="border rounded-xl overflow-hidden">
            {/* Package header */}
            <div
              className="flex items-center gap-3 p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
            >
              {pkg.image_url && (
                <img src={pkg.image_url} alt={pkg.name} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{pkg.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {(pkg.price_per_person / 1000).toFixed(0)}K/suất • {pkgMenus.length} thực đơn
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setEditingPkg(isEditing ? null : { ...pkg }); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {/* Edit package form */}
            {isEditing && editingPkg && (
              <div className="p-4 bg-muted/10 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold">Tên combo</label>
                    <Input value={editingPkg.name || ''} onChange={e => setEditingPkg({ ...editingPkg, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Giá/suất (VNĐ)</label>
                    <Input type="number" value={editingPkg.price_per_person || 0} onChange={e => setEditingPkg({ ...editingPkg, price_per_person: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold">Mô tả (VI)</label>
                  <Textarea value={editingPkg.description_vi || ''} onChange={e => setEditingPkg({ ...editingPkg, description_vi: e.target.value })} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold">Upload ảnh combo:</label>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUploadPkgImage(pkg.id, e.target.files[0])} disabled={uploading} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => savePkg(editingPkg)} className="gap-1"><Save className="h-4 w-4" /> Lưu</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPkg(null)}>Hủy</Button>
                </div>
              </div>
            )}

            {/* Expanded: show menus */}
            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-border">
                {pkgMenus.map(menu => {
                  const menuDishes = getDishesByMenu(menu.id);
                  const isMenuExpanded = expandedMenu === menu.id;

                  return (
                    <div key={menu.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-3 bg-muted/20 cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedMenu(isMenuExpanded ? null : menu.id)}
                      >
                        <span className="font-semibold text-sm">{menu.name_vi}</span>
                        <span className="text-xs text-muted-foreground">({menuDishes.length} món)</span>
                        <div className="ml-auto flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteMenu(menu.id); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                          {isMenuExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {isMenuExpanded && (
                        <div className="p-3 space-y-2">
                          {menuDishes.map((dish, i) => (
                            <div key={dish.id} className="flex items-center gap-2 text-sm">
                              <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                              <span className="flex-1">{dish.name_vi}</span>
                              <span className="text-xs text-muted-foreground">{dish.name_en}</span>
                              <Button variant="ghost" size="sm" onClick={() => deleteDish(dish.id)}>
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}

                          {/* Add dish */}
                          {newDishMenuId === menu.id ? (
                            <div className="flex gap-2 mt-2">
                              <Input placeholder="Tên món (VI)" value={newDishName} onChange={e => setNewDishName(e.target.value)} className="text-sm" />
                              <Input placeholder="Name (EN)" value={newDishNameEn} onChange={e => setNewDishNameEn(e.target.value)} className="text-sm" />
                              <Button size="sm" onClick={() => addDish(menu.id)}>Thêm</Button>
                              <Button size="sm" variant="ghost" onClick={() => setNewDishMenuId(null)}>Hủy</Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => setNewDishMenuId(menu.id)}>
                              <Plus className="h-3 w-3" /> Thêm món
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" size="sm" onClick={() => addMenu(pkg.id)} className="gap-1">
                  <Plus className="h-4 w-4" /> Thêm thực đơn mới
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdminCombo;
