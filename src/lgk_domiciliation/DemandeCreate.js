import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Components } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { Data } from "../../dataOffline";
import ApiService from "../../api/services/api.service";
import { Services } from "../../services";
import { demandsSelector } from "../../store/demands/selectors";
import { useDispatch, useSelector } from "react-redux";
import { verificationUserRequest } from "../../store/demands/actions";
import { getLocalState } from "../../utils/localStorage";
import { dataDataGreffeRccm } from "../../services/DatagreffeService";
import { renouv_domiciliation } from "./features";
import { toast } from "react-toastify";

const apiUrl = new ApiService();
const ENV = process.env;

function DemandeCreate(props) {
  const abortController = useMemo(() => new AbortController(), []);
  const { ChampsDemande } = useMemo(() => Data, []);
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();

  const [pays, setPays] = useState("");
  const [champsDemandeData, setChampsDemandeData] = useState([]);
  const [champsDemandeObject, setChampsDemandeObject] = useState({});
  const [domiciliationData, setDomiciliationData] = useState({});
  const [typeEntreprise, setTypeEntreprise] = useState({});
  const [moyen_paiements, setMoyens_payements] = useState([]);

  // const [transitData, setTransitData] = useState("");
  const [tempData, setTempData] = useState("b");
  const [step, setStep] = useState(0);
  const useDemands = demandsSelector(useSelector((state) => state));
  const { verification_user_loading } = useDemands;
  //const demande_id = useDemands.demands_detail.id;
  // console.log(demande_id);

  const { dossier_id } = useDemands.demands_pays_list.demandes[1];

  /* Formation */

  let tabFormation = {
    name: "cabinet-formation",
    question:
      "Souhaitez vous être accompagné par Legafrik pour obtenir votre agrément FDFP ?",
    description: "",
    type: "mutiple", //"mutiple",
    options: [
      {
        value:
          "Je me fais accompagner pour obtenir l'agrément FDFP (100 000 FCFA)",
        price: 100_000,
      },
      { value: "Je ne suis pas Intéressé ", price: "" },
    ],
  };

  /* Transit */

  let tabTrasit = {
    name: "cabinet-transit",
    question:
      "Souhaitez-vous d'être accompagné pour l'obtention du code import/export ?",
    description: "",
    type: "mutiple", //"mutiple",
    options: [
      {
        value:
          "Je me fais accompagner pour obtenir le code Import/Export (50 000 FCFA)",
        price: 50_000,
      },
      { value: "Je ne suis pas Intéressé ", price: "" },
    ],
  };

  /* Transport */

  let tabTransport = {
    name: "transport",
    question:
      "Souhaitez-vous être accompagné par Legafrik pour vous immatriculer au Registre des transporteurs ?",
    description: "",
    type: "mutiple", //"mutiple",
    options: [
      {
        value:
          "Je me fais accompagner pour mon immatriculation (100 000 Fr CFA)",
        price: 100_000,
      },
      { value: "Je ne suis pas Intéressé ", price: "" },
    ],
  };

  /* Option domicilie à Legafrik */
  let optionDomicili = {
    value: "Je domicilie à Legafrik (30 000 FCFA/mois)",
    price: "",
  };

  const handleNextClick = (e, name, value) => {
    e.preventDefault();
    let champsDemandeObjectCopy = {};

    if (name === "domiciliationcontrat-cdi-cdd") {
      if (value["type-employeur"] === "Entreprise") {
        champsDemandeObjectCopy = {
          "type-employeur": value["type-employeur"],
          denomination: [value["denomination"]],
        };
      } else {
        champsDemandeObjectCopy = {
          "type-employeur": value["type-employeur"],
          denomination: [],
        };
      }
    } else {
      champsDemandeObjectCopy = { ...champsDemandeObject };
      champsDemandeObjectCopy[name] = value;
      setTempData(value);
    }

    setChampsDemandeObject(champsDemandeObjectCopy);
    //setStep(step + 1);

    if (
      champsDemandeData.length > 0 &&
      step + 1 - champsDemandeData.length === 1
    ) {
      const currentUser = getLocalState("_currentUser");

      let verify_payload = {
        numero_telephone: ENV.REACT_APP_VERIFY_PHONE,
        email: ENV.REACT_APP_VERIFY_EMAIL,
        username: currentUser?.username,
        password: "LegafrikV3",
      };

      // renouvellement de contrat de domiciliation
      if (champsDemandeObjectCopy["numero-registe"]) {
        dataDataGreffeRccm(champsDemandeObjectCopy["numero-registe"])
          .then((res) => {
            if (res.status === 200) {
              const { data } = res.response;
              if (Array.isArray(data) && data.length > 0) {
                const {
                  "numero-telephone": _,
                  ...champsDemandeDataCopy_phone
                } = champsDemandeObjectCopy;

                champsDemandeObjectCopy = {
                  ...champsDemandeDataCopy_phone,
                  denomination: data[0]?.denomination,
                  "capital-social": data[0]?.capital,
                  gerants: JSON.stringify([
                    {
                      type: "particulier",
                      nom: data[0]?.dirigeants[0]?.nom_dirigeant,
                      prenoms: data[0]?.dirigeants[0]?.prenom_dirigeant,
                      "adresse-mail": data[0]?.dirigeants[0]?.mail_dirigeant,
                      "numero-telephone":
                        "+225" + champsDemandeObjectCopy["numero-telephone"],
                    },
                  ]),
                  "localisation-siege": "Legafrik",
                };

                const payload = {
                  dossier_id: dossier_id,
                  pays_id: pays.id,
                  montant_total: 1500,
                  type_demande_id: id,
                  champs_demande: JSON.stringify(champsDemandeObjectCopy),
                };

                console.log(payload);

                renouv_domiciliation(verify_payload, payload, navigate);
              } else {
                toast.error("Aucune donnée trouvée !");
              }
            } else {
              toast.error(
                "Un problème est survenu veuillez contacter le service client."
              );
            }
          })
          .catch((error) => {
            console.error("Erreur", error);
            toast.error(
              "Un problème est survenu veuillez contacter le service client."
            );
          });
      } else {
        const payload = {
          pays_id: pays.id,
          champs_demande: JSON.stringify(champsDemandeObjectCopy),
          montant_total: 1500,
          type_demande_id: id,
        };

        dispatch(verificationUserRequest(verify_payload, payload, navigate));
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    //  if (step === 0 || useDemande.isDisabled) return;
    setStep(step - 1);
  };

  const initialize = useCallback(async () => {
    try {
      await apiUrl
        ._get(`type-demandes/${id}`)
        .then((response) => {
          setTypeEntreprise(response?.data?.type_demande);
          setPays(response?.data?.type_demande?.pays);
        })
        .catch((error) => {});

      const { moyen_paiements } = await Services.MoyenPaiementService.getAlls(
        abortController.signal
      );
      setMoyens_payements(moyen_paiements);
      //setPays(pays);
    } catch (error) {
      if ("messages" in error) return;
      //toast
    }
  }, [id]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  /* Commune de l'entreprise */

  useEffect(() => {
    const reform = champsDemandeData.map((data) => {
      let dataOption = data.options.filter(
        (val, index) => !val.value.includes("domicilie à Legafrik")
      );
      return { ...data, options: [...dataOption] };
    });
    if (tempData.includes("Hors")) {
      const reformat = reform.map((data) => {
        let dataOption = data.options.filter(
          (val, index) => !val.value.includes("domicilie à Legafrik")
        );
        return { ...data, options: [...dataOption] };
      });
      setChampsDemandeData(reformat);
    }

    /* Recuperation de prix en fonction de cummune */

    if (parseInt(tempData) > 0) {
      const champsDemandeDataCopy = reform.map((data, index) => {
        if (data.name === "localisation-siege") {
          data.options.unshift(optionDomicili);
        }
        return { ...data, options: [...data.options] };
      });
      setChampsDemandeData(champsDemandeDataCopy);
    }
  }, [tempData]);

  /* fin Commune de l'entreprise */

  useEffect(() => {
    const localisationSiege = champsDemandeObject["localisation-siege"];

    if (
      localisationSiege !== undefined &&
      !localisationSiege.includes("Legafrik")
    ) {
      champsDemandeData.forEach((data, index) => {
        if (data.name !== "gestion-domiciliation") return;
        setDomiciliationData({ index, object: data });
      });
      const champsDemandeDataCopy = champsDemandeData.map((data) => {
        return { ...data, options: [...data.options] };
      });
      const domiciliationIndex = champsDemandeDataCopy.findIndex(
        (data) => data.name === "gestion-domiciliation"
      );

      if (domiciliationIndex < 0) return;

      champsDemandeDataCopy.splice(domiciliationIndex, 1);
      setChampsDemandeData(champsDemandeDataCopy);
    } else {
      const domiciliationDataIndex = domiciliationData.index;

      if (!domiciliationDataIndex || domiciliationDataIndex < 0) return;
      const champsDemandeDataCopy = champsDemandeData.map((data) => {
        return { ...data, options: [...data.options] };
      });

      champsDemandeDataCopy.splice(
        domiciliationDataIndex,
        0,
        domiciliationData.object
      );

      setChampsDemandeData(champsDemandeDataCopy);
      setDomiciliationData({});
    }
  }, [champsDemandeObject["localisation-siege"]]);

  useEffect(() => {
    if (!pays.code) return;

    const LIBELLE = typeEntreprise?.libelle;
    const CODE_PAYS = pays.code.toUpperCase();
    console.log("ChampsDemande", ChampsDemande);
    console.log("LIBELLE", LIBELLE);
    console.log(" ChampsDemande[CODE_PAYS]", ChampsDemande[CODE_PAYS]);

    if (LIBELLE.includes("SARL"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SARL]);
    if (LIBELLE.includes("SARLU"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SARLU]);
    if (LIBELLE.includes("SUARL"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SARLU]);
    if (LIBELLE.includes("SAS"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SAS]);

    if (LIBELLE.includes("SCI commerciale"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SAS]);

    if (LIBELLE.includes("SCI civile"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SCI]);

    if (LIBELLE.includes("SASU"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].SASU]);
    if (LIBELLE.includes("ONG"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].ONG]);
    if (LIBELLE.includes("Association"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].ASSOCIATION]);
    if (LIBELLE.includes("Fondation"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].FONDATION]);
    if (LIBELLE.includes("Domiciliation"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].DOMICILIATION]);
    if (LIBELLE.includes("Marque"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].DEPOT_MARQUE]);
    if (LIBELLE.includes("Redaction contrat CDI"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].CDI]);
    if (LIBELLE.includes("Redaction contrat CDD"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].CDD]);

    if (LIBELLE.includes("statutaire"))
      setChampsDemandeData([
        ...ChampsDemande[CODE_PAYS].MODIFICATION_STATUTAIRE,
      ]);
    if (LIBELLE.includes("individuelle"))
      setChampsDemandeData([...ChampsDemande[CODE_PAYS].INDIVIDUEL]);
    setStep(1);
  }, [typeEntreprise.libelle, ChampsDemande, pays.code]);

  useEffect(
    () => {
      // if (!pays.code) return;
      // console.log("champsDemandeData", champsDemandeData);
      // const LIBELLE = useTypeDemande.libelle;
      // const CODE_PAYS = pays;
      const sectuerActivite = champsDemandeObject["secteur-activite"];

      const reform = champsDemandeData.map((data) => {
        return { ...data, options: [...data.options] };
      });

      console.log("reform", reform);

      if (pays.code?.includes("CI")) {
        if (
          sectuerActivite !== undefined &&
          !tempData.includes("formation") &&
          !tempData.includes("Transit") &&
          !tempData.includes("Transport")
        ) {
          const champsDemandeDataCopyed = reform.filter(
            (data) =>
              !data.name.includes("cabinet-formation") &&
              !data.name.includes("cabinet-transit") &&
              !data.name.includes("transport")
          );

          setChampsDemandeData(champsDemandeDataCopyed);
        }

        if (sectuerActivite !== undefined && tempData.includes("formation")) {
          const reformat = reform.filter(
            (data) =>
              !data.name.includes("cabinet-transit") &&
              !data.name.includes("transport") &&
              !data.name.includes("cabinet-formation")
          );
          reformat.push(tabFormation);
          setChampsDemandeData(reformat);
        }

        if (sectuerActivite !== undefined && tempData.includes("Transit")) {
          const reformated = reform.filter(
            (data) =>
              !data.name.includes("cabinet-formation") &&
              !data.name.includes("transport") &&
              !data.name.includes("cabinet-transit")
          );
          reformated.push(tabTrasit);
          setChampsDemandeData(reformated);
        }

        if (sectuerActivite !== undefined && tempData.includes("Transport")) {
          const reformatedTransport = reform.filter(
            (data) =>
              !data.name.includes("cabinet-formation") &&
              !data.name.includes("cabinet-transit") &&
              !data.name.includes("transport")
          );
          reformatedTransport.push(tabTransport);
          setChampsDemandeData(reformatedTransport);
        }
      }
    },
    [champsDemandeObject["secteur-activite"]],
    tempData,
    pays.code
  );

  return (
    <div className="col-span-12 mt-8">
      <h2 className="intro-y text-lg font-medium">
        Nouvelle commande "{typeEntreprise.libelle} {pays.libelle}"
      </h2>
      {champsDemandeData && champsDemandeData.length > 0 ? (
        <div className="intro-y box py-10 sm:py-20">
          <Components.ProgressBar value={step} max={champsDemandeData.length} />

          {champsDemandeData.map((champsDemandeDataItem, index) => {
            return (
              <Fragment key={index}>
                <Components.DemandeStep
                  step={step}
                  index={index + 1}
                  length={champsDemandeData.length}
                  demande={typeEntreprise.libelle}
                  champsDemandeData={champsDemandeDataItem}
                  handleNextClick={handleNextClick}
                  handleBackClick={handleBackClick}
                  champsDemandeObject={champsDemandeObject}
                  isVerify={verification_user_loading}
                />
              </Fragment>
            );
          })}

          {/*         {champsDemandeData.length > 0 &&
          step - champsDemandeData.length === 1 ? (
              <Components.Summary
                  productList={champsDemandeData}
                  handleRemoveProduct={null}
                  handleBackClick={handleBackClick}
                  handleValidateClick={handleValidateClick}
                  isDisabled={verification_user_loading}
                  setAmount={handleSetAmount}
                  amount={usePaiement.montant}
                  currency={pays.monnaie}
              />
          ) : null}*/}
        </div>
      ) : (
        <div className="flex items-center justify-center text-xl font-medium intro-y box py-10 sm:py-20">
          Formulaire indisponible pour le moment
        </div>
      )}
    </div>
  );
}

export default DemandeCreate;
