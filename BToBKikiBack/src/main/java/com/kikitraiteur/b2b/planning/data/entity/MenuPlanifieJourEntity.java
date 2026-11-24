package com.kikitraiteur.b2b.planning.data.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "b2b_menus_planifies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuPlanifieJourEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String entrepriseId;

    @Column(nullable = false)
    private String jourNom; // Lundi .. Dimanche

    private String dateStr; // YYYY-MM-DD
    private String theme;

    @Builder.Default
    private boolean quantitesSaisies = false;

    @Builder.Default
    private String statutConformite = "NON_SAISI"; // CONFORME, NON_CONFORME, NON_SAISI

    @OneToMany(mappedBy = "menuPlanifie", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<LigneMenuPlanifieEntity> lignes = new ArrayList<>();
}
