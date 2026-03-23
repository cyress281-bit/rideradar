import React, { useState } from "react";
import { Bike, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function MotorcycleModels({ models = [], onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ year: "", make: "", model: "", class: "" });

  const handleAdd = () => {
    if (!form.make || !form.model) return;
    const newModels = [...models, { ...form, year: form.year ? parseInt(form.year) : undefined }];
    onUpdate(newModels);
    setForm({ year: "", make: "", model: "", class: "" });
    setShowForm(false);
  };

  const handleRemove = (idx) => {
    onUpdate(models.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <Bike className="w-3.5 h-3.5" /> My Motorcycles
      </Label>

      <div className="space-y-2 mb-3">
        <AnimatePresence>
          {models.map((bike, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 border border-border/50"
            >
              <div>
                <p className="text-sm font-medium">
                  {bike.year && `${bike.year} `}{bike.make} {bike.model}
                </p>
                {bike.class && <p className="text-[10px] text-muted-foreground capitalize">{bike.class}</p>}
              </div>
              <button
                onClick={() => handleRemove(idx)}
                className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary/30 rounded-lg p-3 border border-border/50 mb-3 space-y-2"
          >
            <Input
              type="number"
              placeholder="Year (optional)"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="bg-secondary border-border text-xs"
            />
            <Input
              placeholder="Make"
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              className="bg-secondary border-border text-xs"
            />
            <Input
              placeholder="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="bg-secondary border-border text-xs"
            />
            <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
              <SelectTrigger className="bg-secondary border-border text-xs">
                <SelectValue placeholder="Class (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sportbike">Sportbike</SelectItem>
                <SelectItem value="cruiser">Cruiser</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="naked">Naked</SelectItem>
                <SelectItem value="touring">Touring</SelectItem>
                <SelectItem value="dual_sport">Dual Sport</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                className="flex-1 h-8 bg-primary text-xs"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="flex-1 h-8"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Motorcycle
        </Button>
      )}
    </div>
  );
}