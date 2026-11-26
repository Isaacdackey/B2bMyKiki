package com.kikitraiteur.b2b.entreprise.data.entity;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "b2b_categories_plat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriePlatEntity {
    @Id
    private String code;

    @Column(nullable = false)
    private String libelle;

    private String icone;
    private String couleur;

    @Builder.Default
    @JsonProperty("isArchive")
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isArchive = false;

    public boolean isArchive() {
        return Boolean.TRUE.equals(isArchive);
    }

    public void setArchive(Boolean isArchive) {
        this.isArchive = Boolean.TRUE.equals(isArchive);
    }
}
