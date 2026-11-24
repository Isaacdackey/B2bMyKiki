package com.kikitraiteur.b2b.planning.data.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "b2b_lignes_menu_planifie")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneMenuPlanifieEntity {
    @Id
    private String id;

    private String categorie;
    private String platId;
    private String nomPlat;
    private String image;

    @Builder.Default
    private Integer quantitePrevue = 0;

    @Builder.Default
    private boolean disponible = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_planifie_id")
    @JsonIgnore
    private MenuPlanifieJourEntity menuPlanifie;
}
