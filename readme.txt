MODULE RAPPORTS - VERSION SIMPLIFIEE

Contexte

Dans ce projet, la table "activities" sert aux actualites et a la communication.
Le module "rapports" est donc un module totalement separe, destine a la gestion
interne de l'association.

Ce module sert uniquement a :

- enregistrer les informations decidees lors d'une reunion ou d'un evenement interne
- enregistrer la liste des membres presents

La gestion de caisse (entree ou sortie) ne fait pas partie de ce module.
Elle sera mise en place plus tard dans un module distinct.

But du module rapports

Le module rapports doit permettre de :

- creer un rapport de reunion
- decrire ce qui a ete dit ou decide
- enregistrer les membres presents
- garder une trace officielle des reunions internes

Important

Une reunion de bureau peut contenir comme presents :

- des membres du bureau
- des membres simples

Donc la table de presence ne doit jamais etre limitee au type "bureau".
Le type du rapport et le type du membre present sont deux choses differentes.

Tables a ajouter

1. reports

Role :
- table principale des rapports internes

Utilisation :
- reunion de bureau
- reunion generale
- rassemblement
- fete
- autre evenement interne

Colonnes recommandees :
- id
- title
- report_type
- report_date
- start_time
- end_time
- location
- subject
- agenda
- content
- decisions_summary
- written_by
- approved_by
- status
- is_confidential
- created_at
- updated_at

Description des champs principaux :
- title : titre du rapport ou de la reunion
- report_type : type de rapport
- report_date : date de la reunion
- start_time : heure de debut
- end_time : heure de fin
- location : lieu
- subject : objet de la reunion
- agenda : ordre du jour
- content : contenu principal du rapport
- decisions_summary : resume des decisions prises
- written_by : utilisateur qui redige le rapport
- approved_by : utilisateur qui valide le rapport
- status : etat du rapport
- is_confidential : indique si le rapport est interne/confidentiel

Valeurs possibles pour report_type :
- bureau_meeting
- general_meeting
- gathering
- celebration
- event
- other

Valeurs possibles pour status :
- draft
- validated
- archived

2. report_attendances

Role :
- rattacher la liste des membres presents a un rapport

Colonnes recommandees :
- id
- report_id
- member_id
- attendance_status
- notes
- recorded_by
- created_at
- updated_at

Valeurs possibles pour attendance_status :
- present
- absent
- excused
- late

Remarque :
- cette table doit accepter aussi bien les membres du bureau que les membres simples

Relations recommandees

- reports 1 -> n report_attendances
- members 1 -> n report_attendances

Exemple concret

Cas :
- reunion de bureau

Le rapport doit contenir :
- les informations decidees
- les remarques importantes
- le resume de la reunion
- la liste des membres presents

Exemple de presents :
- president
- tresorier
- secretaire
- membre simple A
- membre simple B

Donc une reunion de bureau peut avoir :
- type du rapport = bureau_meeting
- participants = bureau + membres simples

Workflow recommande

1. creer le rapport
2. saisir les informations generales
3. saisir le contenu de la reunion
4. saisir le resume des decisions
5. enregistrer les membres presents
6. valider le rapport

Ecrans admin recommandes

1. Liste des rapports
- filtre par type
- filtre par mois
- filtre par annee
- filtre par statut

2. Formulaire rapport
- informations generales
- contenu du rapport
- decisions
- presences

3. Detail rapport
- informations de la reunion
- texte complet
- liste des presents
- total des presents

Ce qui n'est pas inclus maintenant

Le module rapports ne gere pas encore :

- les depenses
- les entrees de caisse
- les sorties de caisse
- les actions a faire
- les pieces jointes

Ces elements seront geres plus tard dans un autre module, notamment
la gestion d'entree ou sortie de caisse de l'association.

Minimum viable recommande

Pour la version actuelle, il faut ajouter uniquement :

- reports
- report_attendances

Conclusion

Le module rapports doit rester simple pour le moment.
Il sert seulement a garder une trace des reunions internes et de la presence
des membres. La gestion financiere viendra plus tard dans un module separe.
