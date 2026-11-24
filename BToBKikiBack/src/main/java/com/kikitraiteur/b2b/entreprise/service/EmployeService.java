package com.kikitraiteur.b2b.entreprise.service;

import com.kikitraiteur.b2b.entreprise.data.entity.EmployeEntity;
import com.kikitraiteur.b2b.entreprise.data.repository.EmployeRepository;
import com.kikitraiteur.b2b.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeService {

    private final EmployeRepository employeRepository;

    public List<EmployeEntity> findAll(String entrepriseId) {
        if (entrepriseId != null && !entrepriseId.isBlank()) {
            return employeRepository.findByEntrepriseId(entrepriseId);
        }
        return employeRepository.findAll();
    }

    public EmployeEntity create(EmployeEntity emp) {
        if (emp.getId() == null || emp.getId().isBlank()) {
            emp.setId("emp-" + System.currentTimeMillis());
        }
        if (emp.getMatricule() == null || emp.getMatricule().isBlank()) {
            emp.setMatricule("EMP-" + (System.currentTimeMillis() % 10000));
        }
        emp.setType(emp.getTauxSubvention() != null && emp.getTauxSubvention() > 0 ? "SUBVENTIONNE" : "AUTONOME");
        return employeRepository.save(emp);
    }

    public List<EmployeEntity> importBatch(List<EmployeEntity> employes) {
        for (EmployeEntity emp : employes) {
            if (emp.getId() == null || emp.getId().isBlank()) {
                emp.setId("emp-" + System.nanoTime());
            }
            if (emp.getMatricule() == null || emp.getMatricule().isBlank()) {
                emp.setMatricule("EMP-" + (System.nanoTime() % 100000));
            }
            emp.setType(emp.getTauxSubvention() != null && emp.getTauxSubvention() > 0 ? "SUBVENTIONNE" : "AUTONOME");
        }
        return employeRepository.saveAll(employes);
    }

    public EmployeEntity updateTauxSubvention(String id, Integer taux) {
        EmployeEntity emp = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable : " + id));
        emp.setTauxSubvention(taux);
        emp.setType(taux != null && taux > 0 ? "SUBVENTIONNE" : "AUTONOME");
        return employeRepository.save(emp);
    }

    public EmployeEntity toggleActif(String id) {
        EmployeEntity emp = employeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable : " + id));
        boolean nextActif = !emp.isActif();
        emp.setActif(nextActif);
        if (!nextActif) {
            emp.setTauxSubvention(0);
            emp.setType("AUTONOME");
        }
        return employeRepository.save(emp);
    }
}
